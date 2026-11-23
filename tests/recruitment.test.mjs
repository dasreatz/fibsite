import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createRecruitmentApi} from '../lib/recruitment.mjs';

test('full lifecycle: submit, private status, staff review, 72-hour invite, one-time redemption',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'fib-recruitment-'));
 t.after(async()=>rm(dir,{recursive:true,force:true}));
 const api=await createRecruitmentApi({FIB_DATA_DIR:dir,FIB_APPLICATIONS_OPEN:'true',FIB_ADMIN_PASSWORD:'very-secret-admin-passphrase',FIB_SESSION_SECRET:'a-secret-string-with-64-or-more-characters-12345678901234567890'});
 assert.equal(api.config.accepting,true);
 const server=createServer(async(req,res)=>{await api.handle(req,res,new URL(req.url,'http://localhost'));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async(path,body,cookie)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-FIB-Request':'public-site',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
 const req={rpName:'Kai Test',experience:'Є досвід RP',motivation:'Хочу пройти навчання, виконувати RP-завдання й допомагати команді FIB.',consent:true};
 const created=await post('/api/applications',req);
 assert.equal(created.status,201);const receipt=await created.json();
 assert.match(receipt.id,/^FIB-[0-9A-F]{10}$/);assert.ok(receipt.code.length>=20);
 const wrong=await post('/api/applications/status',{id:receipt.id,code:'wrong'});assert.equal(wrong.status,404);
 const own=await post('/api/applications/status',receipt);assert.equal((await own.json()).status,'pending');
 let forbidden=await post('/api/staff/applications/decision',{id:receipt.id,decision:'approve'});assert.equal(forbidden.status,401);
 const login=await post('/api/staff/login',{password:'very-secret-admin-passphrase'});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const adminRes=await fetch(base+'/api/staff/applications',{headers:{Cookie:cookie}});assert.equal(adminRes.status,200);
 const adminData=await adminRes.json();assert.equal(adminData.items[0].rpName,'Kai Test');
 assert.equal(adminData.items[0].codeHash,undefined);
 const approved=await post('/api/staff/applications/decision',{id:receipt.id,decision:'approve'},cookie);assert.equal(approved.status,200);
 const statusRes=await post('/api/applications/status',receipt);const status=await statusRes.json();assert.equal(status.status,'approved');
 assert.ok(status.invitation.url.startsWith('/invitation/#'));
 const inviteCode=status.invitation.url.split('#')[1];
 const redeem=await post('/api/invitation/redeem',{code:inviteCode});assert.equal(redeem.status,200);
 const again=await post('/api/invitation/redeem',{code:inviteCode});assert.equal(again.status,409);
 const postRedeem=await (await post('/api/applications/status',receipt)).json();assert.equal(postRedeem.invitation.used,true);
 const reissue=await post('/api/staff/applications/decision',{id:receipt.id,decision:'reissue'},cookie);assert.equal(reissue.status,200);
 const newStatus=await (await post('/api/applications/status',receipt)).json();assert.equal(newStatus.invitation.used,false);
 const doc=await readFile(join(dir,'applications.json'),'utf8');
 assert.doesNotMatch(doc,new RegExp(receipt.code));
 assert.doesNotMatch(doc,new RegExp(inviteCode));
 assert.match(doc,/"status": "approved"/);
});
test('disabled store fails closed and CSRF-like requests without custom header are rejected',async()=>{
 const api=await createRecruitmentApi({RENDER:'true',FIB_APPLICATIONS_OPEN:'true'});
 assert.equal(api.config.accepting,false);
 const server=createServer(async(req,res)=>api.handle(req,res,new URL(req.url,'http://localhost')));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const cfg=await (await fetch(base+'/api/config')).json();assert.equal(cfg.applicationsOpen,false);
  const bad=await fetch(base+'/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(bad.status,403);
  const good=await fetch(base+'/api/applications',{method:'POST',headers:{'Content-Type':'application/json','X-FIB-Request':'public-site'},body:'{}'});assert.equal(good.status,503);
 }finally{server.close();}
});

test('no private data may be saved under the published dist directory',async()=>{
 const api=await createRecruitmentApi({FIB_DATA_DIR:'./dist/private-data',FIB_APPLICATIONS_OPEN:'true',FIB_ADMIN_PASSWORD:'very-secret-admin-passphrase',FIB_SESSION_SECRET:'a-secret-string-with-64-or-more-characters-12345678901234567890'});
 assert.equal(api.config.accepting,false);
 assert.equal(api.config.storageReady,false);
});

test('Render refuses relative data directory to reduce accidental ephemeral storage',async()=>{
 const api=await createRecruitmentApi({RENDER:'true',FIB_DATA_DIR:'./runtime-data',FIB_APPLICATIONS_OPEN:'true',FIB_ADMIN_PASSWORD:'very-secret-admin-passphrase',FIB_SESSION_SECRET:'a-secret-string-with-64-or-more-characters-12345678901234567890'});
 assert.equal(api.config.accepting,false);
});
