import {mkdir, readFile, writeFile, rename, chmod} from 'node:fs/promises';
import {resolve, join, sep, isAbsolute} from 'node:path';
import {createHash, createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv} from 'node:crypto';

const sha = x => createHash('sha256').update(x).digest('hex');
const secureMatch = (a,b) => {
 const x=Buffer.from(String(a)); const y=Buffer.from(String(b));
 return x.length===y.length && timingSafeEqual(x,y);
};
const json = (res,code,data,extra={}) => {
 res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',...extra});
 res.end(JSON.stringify(data));
};
const MAX_BODY=16*1024;
async function parseJson(req){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw Object.assign(new Error('Непідтримуваний формат даних.'),{status:415});
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('Занадто великий запит.'),{status:413});chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('Невірний формат JSON.'),{status:400});}
}
function requestIp(req,trustProxy){
 // Only trust forwarded addresses if behind a trusted reverse proxy.
 return trustProxy?(String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress):req.socket.remoteAddress;
}
const allowedExperience=new Set(['Новачок','Є досвід RP','Практичний досвід','Є досвід державних організацій']);
function validateForm(p){
 const rpName=String(p?.rpName||'').normalize('NFC').trim().replace(/\s+/g,' ');
 const experience=String(p?.experience||'');
 const motivation=String(p?.motivation||'').trim();
 if(rpName.length<3 || rpName.length>48 || !/^[\p{L}\p{M} .'-]+$/u.test(rpName))return {error:'Перевір ім’я кандидата (3–48 символів).'};
 if(!allowedExperience.has(experience))return {error:'Вибери варіант досвіду.'};
 if(motivation.length<30 || motivation.length>1200)return {error:'Відповідь має містити від 30 до 1200 символів.'};
 if(p?.consent!==true)return {error:'Підтвердь, що надсилаєш лише ігрові дані.'};
 return {rpName,experience,motivation};
}
function newInvite(secret){
 const code=randomBytes(24).toString('base64url');
 const iv=randomBytes(12), key=createHash('sha256').update(secret).digest();
 const cipher=createCipheriv('aes-256-gcm',key,iv);
 const ciphertext=Buffer.concat([cipher.update(code,'utf8'),cipher.final()]);
 const tag=cipher.getAuthTag();
 return {code, data:{hash:sha(code),encrypted:Buffer.concat([iv,tag,ciphertext]).toString('base64url'),expiresAt:new Date(Date.now()+72*60*60*1000).toISOString(),usedAt:null}};
}
function decryptInvite(data,secret){
 try{
  const bytes=Buffer.from(data,'base64url'),iv=bytes.subarray(0,12),tag=bytes.subarray(12,28),body=bytes.subarray(28);
  const key=createHash('sha256').update(secret).digest();
  const dec=createDecipheriv('aes-256-gcm',key,iv);dec.setAuthTag(tag);
  return Buffer.concat([dec.update(body),dec.final()]).toString('utf8');
 }catch{return null;}
}
function getCookie(req,name){const c=String(req.headers.cookie||'').split(';').map(x=>x.trim());const pair=c.find(x=>x.startsWith(`${name}=`));return pair?pair.slice(name.length+1):'';}

/** Small single-instance, dependency-free recruitment backend.
 * Configure FIB_DATA_DIR to a persistent disk in production, and set FIB_APPLICATIONS_OPEN=true.
 * Keeps the PRIVATE datastore outside the public dist directory. */
export async function createRecruitmentApi(env=process.env){
 const renderHosted=Boolean(env.RENDER || env.RENDER_SERVICE_ID);
 const pathSet=Boolean(env.FIB_DATA_DIR);
 const dataDir=resolve(env.FIB_DATA_DIR || './runtime-data');
 const dbFile=join(dataDir,'applications.json');
 const staticRoot=resolve('./dist');
 const dataDirIsPublic=dataDir===staticRoot || dataDir.startsWith(staticRoot+sep);
 const adminPassword=String(env.FIB_ADMIN_PASSWORD||'');
 const sessionSecret=String(env.FIB_SESSION_SECRET||'');
 const adminConfigured=adminPassword.length>=12 && sessionSecret.length>=32;
 const persistConfigured=(!renderHosted || (pathSet && isAbsolute(env.FIB_DATA_DIR))) && !dataDirIsPublic;
 const accepting=env.FIB_APPLICATIONS_OPEN==='true' && persistConfigured && adminConfigured;
 let storageReady=false;
 let records=[];
 if(dataDirIsPublic)console.error('Recruitment storage configuration rejected: private data directory is inside dist.');
 if(renderHosted && pathSet && !isAbsolute(env.FIB_DATA_DIR))console.error('Recruitment storage configuration rejected: hosted data directory must be an absolute mounted path.');
 if(persistConfigured){
  try{
   await mkdir(dataDir,{recursive:true,mode:0o700});
   try{records=JSON.parse(await readFile(dbFile,'utf8'));if(!Array.isArray(records))throw Error('Invalid DB');}
   catch(err){if(err.code!=='ENOENT')throw err;records=[];}
   storageReady=true;
  }catch(err){console.error('Recruitment storage unavailable:',err.message);}
 }
 let queue=Promise.resolve();
 async function update(mutator){
  const operation=queue.then(async()=>{
   // Mutate in memory and atomically persist. Single-process storage only.
   const next=structuredClone(records);
   const result=await mutator(next);
   const tmp=join(dataDir,`.applications.${randomBytes(8).toString('hex')}.tmp`);
   try{await writeFile(tmp,JSON.stringify(next,null,2),{mode:0o600,flag:'wx'});await rename(tmp,dbFile);await chmod(dbFile,0o600);}finally{try{const{unlink}=await import('node:fs/promises');await unlink(tmp);}catch{}}
   records=next;return result;
  });
  queue=operation.then(()=>{},()=>{});
  return operation;
 }
 const limiters=new Map();
 function limited(req,scope,max,windowMs){
  const key=`${scope}:${requestIp(req,env.FIB_TRUST_PROXY==='true')}`;
  const now=Date.now();const hits=(limiters.get(key)||[]).filter(t=>t>now-windowMs);
  hits.push(now);limiters.set(key,hits);
  if(limiters.size>3000)for(const [k,a] of limiters)if(a.every(t=>t<now-windowMs))limiters.delete(k);
  return hits.length>max;
 }
 const cookieName='fib_staff_session';
 function makeSession(){
  const stamp=Date.now()+8*60*60*1000;
  const payload=`v1.${stamp}.${randomBytes(12).toString('hex')}`;
  const mac=createHmac('sha256',sessionSecret).update(payload).digest('base64url');
  return `${payload}.${mac}`;
 }
 function staffAuthenticated(req){
  if(!adminConfigured)return false;
  const token=getCookie(req,cookieName),chunks=token.split('.');
  if(chunks.length!==4 || chunks[0]!=='v1' || !Number.isSafeInteger(+chunks[1]) || +chunks[1]<=Date.now())return false;
  const payload=chunks.slice(0,3).join('.');
  const mac=createHmac('sha256',sessionSecret).update(payload).digest('base64url');
  return secureMatch(mac,chunks[3]);
 }
 function sessionCookie(req,token){
  // The service is behind HTTPS on Render; HTTP localhost remains testable.
  const isSecure=env.NODE_ENV==='production' || req.headers['x-forwarded-proto']==='https';
  return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/staff; Max-Age=${token?28800:0}${isSecure?'; Secure':''}`;
 }
 const staffPublic=r=>({id:r.id,rpName:r.rpName,experience:r.experience,motivation:r.motivation,createdAt:r.createdAt,status:r.status,decidedAt:r.decidedAt||null,invitationExpiresAt:r.invite?.expiresAt||null,invitationUsedAt:r.invite?.usedAt||null});
 function checkOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return true; // CLI integrations may not set Origin; JSON custom header still required.
  try{return new URL(origin).host === req.headers.host;}catch{return false;}
 }
 async function handle(req,res,url){
  const path=url.pathname;
  if(!path.startsWith('/api/'))return false;
  if(req.method==='OPTIONS'){json(res,405,{error:'Method not allowed'});return true;}
  if(req.method==='POST' && (!checkOrigin(req)||req.headers['x-fib-request']!=='public-site')){json(res,403,{error:'Запит має надходити із сайту FIB.'});return true;}
  try{
   if(path==='/api/config' && req.method==='GET'){
    json(res,200,{applicationsOpen:accepting&&storageReady,storageReady:storageReady&&persistConfigured,staffEnabled:adminConfigured,roleplayProject:true});return true;
   }
   if(path==='/api/applications' && req.method==='POST'){
    if(!accepting||!storageReady){json(res,503,{error:'Надсилання анкет поки вимкнене. Сайт не зберігатиме заявки без налаштованого сховища.'});return true;}
    if(limited(req,'submit',6,60*60*1000)){json(res,429,{error:'Забагато спроб. Спробуй пізніше.'});return true;}
    const valid=validateForm(await parseJson(req));
    if(valid.error){json(res,400,{error:valid.error});return true;}
    const id='FIB-'+randomBytes(5).toString('hex').toUpperCase();
    const code=randomBytes(18).toString('base64url');
    await update(list=>{list.push({id,rpName:valid.rpName,experience:valid.experience,motivation:valid.motivation,createdAt:new Date().toISOString(),status:'pending',codeHash:sha(code)});});
    json(res,201,{id,code,status:'pending'});return true;
   }
   if(path==='/api/applications/status'&&req.method==='POST'){
    if(limited(req,'lookup',45,60*60*1000)){json(res,429,{error:'Забагато перевірок. Спробуй пізніше.'});return true;}
    const b=await parseJson(req),id=String(b?.id||'').trim().toUpperCase(),code=String(b?.code||'');
    const r=records.find(x=>x.id===id && secureMatch(x.codeHash,sha(code)));
    if(!r){json(res,404,{error:'Не знайдено заявку з таким номером і кодом.'});return true;}
    const result={id:r.id,rpName:r.rpName,status:r.status,createdAt:r.createdAt,decidedAt:r.decidedAt||null};
    if(r.status==='approved' && r.invite){
     result.invitation={expiresAt:r.invite.expiresAt,used:Boolean(r.invite.usedAt),expired:Date.now()>Date.parse(r.invite.expiresAt)};
     if(!r.invite.usedAt && !result.invitation.expired){
      const inviteCode=decryptInvite(r.invite.encrypted,sessionSecret);
      if(inviteCode)result.invitation.url=`/invitation/#${encodeURIComponent(inviteCode)}`;
     }
    }
    json(res,200,result);return true;
   }
   if(path==='/api/staff/login'&&req.method==='POST'){
    if(!adminConfigured){json(res,503,{error:'Вхід для керівництва ще не налаштований.'});return true;}
    if(limited(req,'login',8,30*60*1000)){json(res,429,{error:'Забагато спроб входу.'});return true;}
    const b=await parseJson(req);
    const allowed=secureMatch(sha(String(b?.password||'')),sha(adminPassword));
    if(!allowed){json(res,401,{error:'Невірний пароль.'});return true;}
    json(res,200,{ok:true},{'Set-Cookie':sessionCookie(req,makeSession())});return true;
   }
   if(path==='/api/staff/logout'&&req.method==='POST'){
    json(res,200,{ok:true},{'Set-Cookie':sessionCookie(req,'')});return true;
   }
   if(path==='/api/staff/applications'&&req.method==='GET'){
    if(!staffAuthenticated(req)){json(res,401,{error:'Потрібна авторизація.'});return true;}
    json(res,200,{items:records.map(staffPublic).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))});return true;
   }
   if(path==='/api/staff/applications/decision'&&req.method==='POST'){
    if(!staffAuthenticated(req)){json(res,401,{error:'Потрібна авторизація.'});return true;}
    if(!storageReady){json(res,503,{error:'Сховище недоступне.'});return true;}
    const b=await parseJson(req),id=String(b?.id||''),decision=String(b?.decision||'');
    if(!['approve','reject','reissue'].includes(decision)){json(res,400,{error:'Невідоме рішення.'});return true;}
    const result=await update(list=>{
     const r=list.find(x=>x.id===id);
     if(!r)return {status:404,error:'Анкету не знайдено.'};
     if(decision==='reissue'&&r.status!=='approved')return {status:409,error:'Повторне запрошення можливе лише для схваленої заявки.'};
     if(decision!=='reissue'&&r.status!=='pending')return {status:409,error:'Рішення вже прийняте.'};
     if(decision==='reject'){r.status='rejected';r.decidedAt=new Date().toISOString();}
     else{r.status='approved';r.decidedAt=r.decidedAt||new Date().toISOString();r.invite=newInvite(sessionSecret).data;}
     return {status:200,item:staffPublic(r)};
    });
    json(res,result.status,result.status===200?{ok:true,item:result.item}:{error:result.error});return true;
   }
   if(path==='/api/invitation/redeem'&&req.method==='POST'){
    if(limited(req,'invitation',30,60*60*1000)){json(res,429,{error:'Забагато спроб.'});return true;}
    const b=await parseJson(req),code=String(b?.code||'');
    if(code.length<15||code.length>100){json(res,400,{error:'Невірний код.'});return true;}
    const result=await update(list=>{
     const r=list.find(x=>x.invite?.hash===sha(code) && x.status==='approved');
     if(!r)return {status:404,error:'Запрошення не знайдене.'};
     if(r.invite.usedAt)return {status:409,error:'Це запрошення вже використане.'};
     if(Date.now()>Date.parse(r.invite.expiresAt))return {status:410,error:'Термін запрошення минув.'};
     r.invite.usedAt=new Date().toISOString();
     return {status:200,id:r.id};
    });
    json(res,result.status,result.status===200?{ok:true,id:result.id}:{error:result.error});return true;
   }
   json(res,404,{error:'API route not found'});return true;
  }catch(err){
   if(err.status){json(res,err.status,{error:err.message});}
   else{console.error('Recruitment API failed:',err);json(res,500,{error:'Внутрішня помилка. Спробуй пізніше.'});}
   return true;
  }
 }
 return {handle,config:{accepting:accepting&&storageReady,adminConfigured,storageReady},getRecords:()=>structuredClone(records)};
}
