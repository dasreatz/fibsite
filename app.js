// Preserve old section links that used homepage hash fragments.
if (document.body.classList.contains('route-home')) {
  const legacy = { bureau:'bureau', units:'units', departments:'units', activity:'units', operations:'units', news:'news', documents:'documents', academy:'academy', contacts:'contacts', join:'join', recruitment:'join' };
  const target = legacy[location.hash.slice(1).toLowerCase()];
  if (target) location.replace(location.pathname.replace(/(?:index\.html)?$/, '') + target + '/');
}

// Text returned by the recruitment API is localized without changing API field values.
const FIB_LANG=document.documentElement.lang||'uk';
const fibText=(uk,en,de)=>FIB_LANG==='en'?en:FIB_LANG==='de'?de:uk;
const RUNTIME_TEXT=[
 ['Новачок','Без досвіду','Ohne Vorerfahrung'],['Є досвід RP','Practical experience','Praktische Erfahrung'],['Практичний досвід','Practical experience','Praktische Erfahrung'],['Є досвід державних організацій','Public service experience','Erfahrung im öffentlichen Dienst'],
 ['Відкрити меню','Open menu','Menü öffnen'],['Закрити меню','Close menu','Menü schließen'],
 ['Сервер заявок недоступний. Дані не надіслано.','The application server is unavailable. No data was sent.','Der Bewerbungsserver ist nicht verfügbar. Es wurden keine Daten gesendet.'],
 ['Не вдалося виконати запит.','Could not complete the request.','Die Anfrage konnte nicht abgeschlossen werden.'],
 ['На розгляді','Under review','In Bearbeitung'],['Схвалено','Approved','Genehmigt'],['Відхилено','Rejected','Abgelehnt'],
 ['Приймання анкет доступне. Рішення ухвалює керівництво.','Applications are open. Decisions are made by bureau leadership.','Bewerbungen sind geöffnet. Die Behördenleitung entscheidet.'],
 ['Приймання анкет наразі вимкнене керівництвом. З правилами вступу можна ознайомитися нижче.','Applications are currently closed by management. You can review the admission requirements below.','Die Annahme von Bewerbungen wurde durch die Leitung geschlossen. Die Aufnahmebedingungen finden Sie unten.'],
 ['Заявки зараз недоступні: не підключено серверну систему. Анкета не надсилається й не зберігається.','Applications are unavailable: the application service is not connected. No data is sent or stored.','Bewerbungen sind nicht verfügbar: Der Bewerbungsdienst ist nicht verbunden. Daten werden weder gesendet noch gespeichert.'],
 ['Заповни всі обов’язкові поля та перевір відповіді (мотивація від 30 символів).','Complete all required fields and check your answers (motivation: at least 30 characters).','Füllen Sie alle Pflichtfelder aus und prüfen Sie Ihre Angaben (Motivation: mindestens 30 Zeichen).'],
 ['Надсилаємо анкету…','Submitting application…','Bewerbung wird gesendet…'],
 ['Анкету прийнято!','Application received!','Bewerbung eingegangen!'],
 ['Збережи обидва значення. Без секретного коду перевірити статус не вийде.','Save both values. Your private code is required to check the application status.','Bewahren Sie beide Angaben auf. Ohne den persönlichen Zugangscode können Sie den Status nicht prüfen.'],
 ['Номер заявки','Application number','Bewerbungsnummer'],['Секретний код','Private access code','Persönlicher Zugangscode'],
 ['Скопіювати дані','Copy details','Daten kopieren'],['Скопійовано','Copied','Kopiert'],
 ['Виділи номер і код вручну та збережи.','Select and save the number and code manually.','Markieren und speichern Sie Nummer und Code manuell.'],
 ['Не вдалося скопіювати. Скопіюй дані вручну.','Could not copy. Please copy the details manually.','Kopieren fehlgeschlagen. Bitte kopieren Sie die Angaben manuell.'],
 ['Перевіряємо…','Checking…','Prüfung läuft…'],['Статус заявки','Application status','Bewerbungsstatus'],
 ['Запрошення на наступний етап уже підтверджено.','The invitation to the next stage has already been confirmed.','Die Einladung zur nächsten Stufe wurde bereits bestätigt.'],
 ['Термін запрошення минув. Керівництво може видати нове.','The invitation has expired. Management may issue a new one.','Die Einladung ist abgelaufen. Die Leitung kann eine neue ausstellen.'],
 ['Відкрити одноразове запрошення','Open invitation','Einladung öffnen'],
 ['Керівництво ще не ухвалило рішення. Перевір статус пізніше.','The bureau has not reached a decision. Please check again later.','Die Behördenleitung hat noch nicht entschieden. Bitte prüfen Sie den Status später erneut.'],
 ['Анкету не схвалено.','The application was not approved.','Die Bewerbung wurde nicht genehmigt.'],
 ['Нових заявок поки немає.','There are no new applications.','Derzeit liegen keine neuen Bewerbungen vor.'],
 ['Запрошення підтверджено.','Invitation confirmed.','Einladung bestätigt.'],
 ['Схвалити','Approve','Genehmigen'],['Відхилити','Reject','Ablehnen'],['Нове запрошення','New invitation','Neue Einladung'],
 ['Відхилити заявку?','Reject this application?','Diese Bewerbung ablehnen?'],
 ['Схвалити й створити запрошення на 72 години?','Approve and issue a 72-hour invitation?','Genehmigen und eine 72-Stunden-Einladung ausstellen?'],
 ['Створити нове запрошення замість попереднього?','Replace the previous invitation with a new one?','Die bisherige Einladung durch eine neue ersetzen?'],
 ['Вхід…','Signing in…','Anmeldung läuft…'],
 ['Сервер перегляду заявок поки недоступний.','The application review server is unavailable.','Der Server zur Bewerbungsprüfung ist nicht verfügbar.'],
 ['Можеш підтвердити отримання запрошення.','You can confirm receipt of your invitation.','Sie können den Erhalt Ihrer Einladung bestätigen.'],
 ['Код запрошення відсутній. Відкрий посилання зі статусу заявки.','The invitation code is missing. Open the link from your application status.','Der Einladungscode fehlt. Öffnen Sie den Link aus Ihrem Bewerbungsstatus.'],
 ['Перевіряємо запрошення…','Checking invitation…','Einladung wird geprüft…'],
 ['Запрошення підтверджено. Наступні дії узгоджуються з керівництвом FIB.','Invitation confirmed. Next steps will be coordinated with FIB management.','Einladung bestätigt. Die nächsten Schritte werden mit der FIB-Leitung abgestimmt.'],
 ['Надсилання анкет поки вимкнене. Сайт не зберігатиме заявки без налаштованого сховища.','Applications are currently disabled. Submissions are not stored without configured storage.','Bewerbungen sind derzeit deaktiviert. Ohne eingerichteten Speicher werden keine Daten gespeichert.'],
 ['Не знайдено заявку з таким номером і кодом.','No application matches this number and code.','Keine Bewerbung mit dieser Nummer und diesem Code gefunden.'],
 ['Невірний пароль.','Incorrect password.','Falsches Passwort.'],
 ['Потрібна авторизація.','Authorization required.','Anmeldung erforderlich.'],
 ['Сервер перегляду заявок поки недоступний.','Application review service unavailable.','Bewerbungsdienst nicht verfügbar.'],
 ['Забагато спроб. Спробуй пізніше.','Too many attempts. Try again later.','Zu viele Versuche. Bitte später erneut versuchen.'],
 ['Запит має надходити із сайту FIB.','This request must originate from the FIB site.','Die Anfrage muss von der FIB-Website stammen.']
];
function fibRuntimeTranslate(message){
 const str=String(message??'');
 if(FIB_LANG==='uk')return str.replaceAll('RP-анкет','анкет').replaceAll('Є досвід RP','Практичний досвід');
 const row=RUNTIME_TEXT.find(r=>r[0]===str);
 if(row)return row[FIB_LANG==='en'?1:2];
 const invitation=str.match(/^Запрошення чинне до (.+)\.$/);
 if(invitation)return fibText(str,`Invitation valid until ${invitation[1]}.`,`Einladung gültig bis ${invitation[1]}.`);
 const app=str.match(/^Заявка (.+) · (.+)$/);
 if(app)return fibText(str,`Application ${app[1]} · ${app[2]}`,`Bewerbung ${app[1]} · ${app[2]}`);
 return str;
}
const fibDate=value=>new Date(value).toLocaleString(FIB_LANG==='en'?'en-GB':FIB_LANG==='de'?'de-DE':'uk-UA');

// Mobile navigation works with mouse, touch, keyboard and Escape.
(() => {
  const menu = document.getElementById('menu-button');
  const navigation = document.getElementById('main-nav');
  if (!menu || !navigation) return;
  const close = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', fibText('Відкрити меню','Open menu','Menü öffnen'));
    navigation.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? fibText('Закрити меню','Close menu','Menü schließen') : fibText('Відкрити меню','Open menu','Menü öffnen'));
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  document.addEventListener('pointerdown', event => {
    if (!navigation.contains(event.target) && !menu.contains(event.target)) close();
  });
})();

// Soft cursor lighting follows the pointer across the whole public site.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const aura = document.createElement('div');
  aura.className = 'cursor-aura';
  aura.setAttribute('aria-hidden', 'true');
  document.body.appendChild(aura);

  let frame = 0;
  let x = -999, y = -999;
  const render = () => {
    aura.style.transform = `translate3d(${x - 110}px,${y - 110}px,0)`;
    frame = 0;
  };
  const move = event => {
    if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    x = event.clientX;
    y = event.clientY;
    aura.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(render);
  };
  const hide = () => aura.classList.remove('is-visible');

  window.addEventListener('pointermove', move, {passive:true});
  window.addEventListener('pointerdown', move, {passive:true});
  window.addEventListener('blur', hide);
  document.documentElement.addEventListener('mouseleave', hide);
  document.addEventListener('mouseout', event => { if (!event.relatedTarget) hide(); });
})();

// No particles are rendered on the main hero photograph.

// Fine-pointer gold reflection on dark homepage panels.
(() => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const selectors = '.home .story-note,.home .unit-item,.home .resources-list a';
  document.querySelectorAll(selectors).forEach(panel => {
    panel.classList.add('pointer-lit');
    panel.addEventListener('pointermove', event => {
      const bounds = panel.getBoundingClientRect();
      panel.style.setProperty('--glow-x', `${event.clientX - bounds.left}px`);
      panel.style.setProperty('--glow-y', `${event.clientY - bounds.top}px`);
    }, {passive:true});
  });
})();

// Real recruitment flow. A Static Site has no API: show an honest unavailable state,
// never pretend an application has been submitted.
(() => {
  const post = async (path, data) => {
    const res = await fetch(path, {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json','X-FIB-Request':'public-site'},body:JSON.stringify(data)});
    let result;
    try { result = await res.json(); } catch { throw Error(fibRuntimeTranslate('Сервер заявок недоступний. Дані не надіслано.')); }
    if (!res.ok) throw Error(fibRuntimeTranslate(result.error||'Не вдалося виконати запит.'));
    return result;
  };
  const putText=(el,text)=>{if(el)el.textContent=fibRuntimeTranslate(text);};
  const add=(parent,tag,text,cls='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=fibRuntimeTranslate(text);parent.appendChild(el);return el;};
  const statusText = {pending:'На розгляді',approved:'Схвалено',rejected:'Відхилено'};
  const avail=document.getElementById('application-availability');
  const form=document.getElementById('application-form');
  const formFeedback=document.getElementById('application-feedback');
  const success=document.getElementById('application-success');
  if (avail && form) {
    fetch('/api/config',{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(Error('backend'))).then(cfg=>{
      if(cfg.applicationsOpen){
        avail.dataset.type='ok';putText(avail,'Приймання анкет доступне. Рішення ухвалює керівництво.');form.hidden=false;
      }else{
        avail.dataset.type='closed';putText(avail,'Приймання анкет наразі вимкнене керівництвом. З правилами вступу можна ознайомитися нижче.');
      }
    }).catch(()=>{avail.dataset.type='closed';putText(avail,'Заявки зараз недоступні: не підключено серверну систему. Анкета не надсилається й не зберігається.');});
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=form.querySelector('button[type=submit]');
      const rpName=form.elements.rpName.value.trim(),experience=form.elements.experience.value,motivation=form.elements.motivation.value.trim();
      if(rpName.length<3||motivation.length<30||!experience||!form.elements.consent.checked){putText(formFeedback,'Заповни всі обов’язкові поля та перевір відповіді (мотивація від 30 символів).');return;}
      submit.disabled=true;putText(formFeedback,'Надсилаємо анкету…');
      try{
        const data=await post('/api/applications',{rpName,experience,motivation,consent:true});
        form.hidden=true;success.hidden=false;success.replaceChildren();
        add(success,'strong','Анкету прийнято!');add(success,'p','Збережи обидва значення. Без секретного коду перевірити статус не вийде.');
        add(success,'p','Номер заявки');add(success,'code',data.id,'secret-display');
        add(success,'p','Секретний код');add(success,'code',data.code,'secret-display');
        const copy=add(success,'button','Скопіювати дані','action-button secondary');copy.type='button';
        copy.addEventListener('click',()=>{
          if(!navigator.clipboard){putText(formFeedback,'Виділи номер і код вручну та збережи.');return;}
          navigator.clipboard.writeText(`Номер: ${data.id}\nКод: ${data.code}`).then(()=>putText(copy,'Скопійовано'),()=>putText(formFeedback,'Не вдалося скопіювати. Скопіюй дані вручну.'));
        });
        const statusForm=document.getElementById('application-status-form');
        if(statusForm){statusForm.elements.id.value=data.id;statusForm.elements.code.value=data.code;}
        putText(formFeedback,'');
      }catch(err){putText(formFeedback,err.message);}finally{submit.disabled=false;}
    });
  }
  const lookup=document.getElementById('application-status-form');
  if(lookup){
    const fb=document.getElementById('status-feedback'),out=document.getElementById('status-result');
    lookup.addEventListener('submit',async event=>{
      event.preventDefault();out.hidden=true;out.replaceChildren();putText(fb,'Перевіряємо…');
      try{
        const data=await post('/api/applications/status',{id:lookup.elements.id.value.trim(),code:lookup.elements.code.value.trim()});
        putText(fb,'');out.hidden=false;
        add(out,'strong',statusText[data.status]||'Статус заявки');
        add(out,'p',`Заявка ${data.id} · ${data.rpName}`);
        if(data.status==='approved'&&data.invitation){
          if(data.invitation.used)add(out,'p','Запрошення на наступний етап уже підтверджено.');
          else if(data.invitation.expired)add(out,'p','Термін запрошення минув. Керівництво може видати нове.');
          else if(data.invitation.url){
            add(out,'p',`Запрошення чинне до ${new Date(data.invitation.expiresAt).toLocaleString(FIB_LANG==='en'?'en-GB':FIB_LANG==='de'?'de-DE':'uk-UA')}.`);
            const a=add(out,'a','Відкрити одноразове запрошення');a.href=FIB_LANG==='uk'?data.invitation.url:data.invitation.url.replace('/invitation/',`/${FIB_LANG}/invitation/`);
          }
        }
        if(data.status==='pending')add(out,'p','Керівництво ще не ухвалило рішення. Перевір статус пізніше.');
        if(data.status==='rejected')add(out,'p','Анкету не схвалено.');
      }catch(err){putText(fb,err.message);}
    });
  }
  const staffLogin=document.getElementById('staff-login-form');
  if(staffLogin){
    const panel=document.getElementById('staff-login-panel'),dashboard=document.getElementById('staff-dashboard'),records=document.getElementById('staff-applications'),fb=document.getElementById('staff-login-feedback');
    async function renderStaff(){
      const res=await fetch('/api/staff/applications',{credentials:'same-origin',cache:'no-store'});
      if(!res.ok){panel.hidden=false;dashboard.hidden=true;return;}
      const body=await res.json();panel.hidden=true;dashboard.hidden=false;records.replaceChildren();
      if(!body.items?.length){add(records,'p','Нових заявок поки немає.');return;}
      for(const item of body.items){
        const card=add(records,'article',undefined,'staff-record');
        const top=add(card,'div',undefined,'staff-record-top');add(top,'h3',item.rpName);
        add(top,'span',statusText[item.status]||item.status,'staff-record-meta');
        add(card,'p',`${item.id} · ${new Date(item.createdAt).toLocaleString(FIB_LANG==='en'?'en-GB':FIB_LANG==='de'?'de-DE':'uk-UA')} · ${item.experience}`);
        add(card,'p',item.motivation);
        if(item.status==='approved'){
          add(card,'p',item.invitationUsedAt?'Запрошення підтверджено.':`Запрошення чинне до ${new Date(item.invitationExpiresAt).toLocaleString(FIB_LANG==='en'?'en-GB':FIB_LANG==='de'?'de-DE':'uk-UA')}`);
        }
        if(item.status==='pending'||item.status==='approved'){
          const actions=add(card,'div',undefined,'staff-record-actions');
          const options=item.status==='pending'?[['approve','Схвалити','primary'],['reject','Відхилити','secondary']]:[['reissue','Нове запрошення','secondary']];
          for(const [decision,label,cl] of options){
            const btn=add(actions,'button',label,`action-button ${cl}`);btn.type='button';
            btn.addEventListener('click',async()=>{
              const question=decision==='reject'?'Відхилити заявку?':decision==='approve'?'Схвалити й створити запрошення на 72 години?':'Створити нове запрошення замість попереднього?';
              if(!window.confirm(fibRuntimeTranslate(question)))return;
              btn.disabled=true;
              try{await post('/api/staff/applications/decision',{id:item.id,decision});await renderStaff();}
              catch(err){window.alert(fibRuntimeTranslate(err.message));btn.disabled=false;}
            });
          }
        }
      }
    }
    staffLogin.addEventListener('submit',async event=>{
      event.preventDefault();putText(fb,'Вхід…');
      try{await post('/api/staff/login',{password:staffLogin.elements.password.value});staffLogin.elements.password.value='';putText(fb,'');await renderStaff();}
      catch(err){putText(fb,err.message);}
    });
    document.getElementById('staff-logout')?.addEventListener('click',async()=>{
      try{await post('/api/staff/logout',{});}catch{}panel.hidden=false;dashboard.hidden=true;records.replaceChildren();
    });
    renderStaff().catch(()=>putText(fb,'Сервер перегляду заявок поки недоступний.'));
  }
  const redeem=document.getElementById('redeem-invite');
  if(redeem){
    const fb=document.getElementById('invitation-feedback'),code=decodeURIComponent(location.hash.replace(/^#/,''));
    if(code.length>=15){redeem.disabled=false;putText(fb,'Можеш підтвердити отримання запрошення.');}
    else putText(fb,'Код запрошення відсутній. Відкрий посилання зі статусу заявки.');
    redeem.addEventListener('click',async()=>{
      redeem.disabled=true;putText(fb,'Перевіряємо запрошення…');
      try{await post('/api/invitation/redeem',{code});history.replaceState(null,'',location.pathname);putText(fb,'Запрошення підтверджено. Наступні дії узгоджуються з керівництвом FIB.');}
      catch(err){putText(fb,err.message);redeem.disabled=false;}
    });
  }
})();



// Fixed lower-left language selector: URLs represent real localized static pages.
(() => {
 const box=document.getElementById('language-dock'),toggle=document.getElementById('language-toggle'),options=document.getElementById('language-options');
 if(!box||!toggle||!options)return;
 const close=()=>{options.hidden=true;toggle.setAttribute('aria-expanded','false');};
 toggle.addEventListener('click',()=>{options.hidden=!options.hidden;toggle.setAttribute('aria-expanded',String(!options.hidden));});
 document.addEventListener('pointerdown',ev=>{if(!box.contains(ev.target))close();});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')close();});
 options.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  try{localStorage.setItem('fib-language',a.lang);}catch{}
 }));
})();

// Director / deputy / division leadership profile overlays.
(() => {
 const modal=document.getElementById('profile-dialog');
 const data=document.getElementById('leader-profiles');
 const root=document.getElementById('profile-dialog-content');
 if(!modal||!data||!root)return;
 let people=[];
 try{people=JSON.parse(data.textContent);}catch{return;}
 const label={
  profile:fibText('Службове досьє','Leadership profile','Führungsprofil'),
  nationality:fibText('Національність','Nationality','Nationalität'),
  age:fibText('Вік','Age','Alter'),
  status:fibText('Статус','Status','Status'),
  unit:fibText('Підрозділ','Division','Abteilung'),
  career:fibText('Службовий шлях','Career history','Beruflicher Werdegang'),
  biography:fibText('Біографія','Biography','Biografie'),
  unpublished:fibText('Не оприлюднено','Not disclosed','Nicht veröffentlicht'),
  withheld:fibText('Біографічні дані цієї посадової особи не оприлюднені.','Biographical information for this position has not been published.','Biografische Angaben zu dieser Position wurden nicht veröffentlicht.')
 };
 const el=(tag,txt,cls,parent)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;parent.appendChild(node);return node;};
 const field=(title,value,target)=>{const item=el('div',undefined,'profile-field',target);el('span',title,'',item);el('strong',value||label.unpublished,'',item);};
 document.querySelectorAll('.profile-trigger').forEach(trigger=>trigger.addEventListener('click',()=>{
  const p=people.find(p=>p.id===trigger.dataset.person);if(!p)return;
  root.replaceChildren();const body=el('div',undefined,'profile-dialog-body',root);
  const head=el('div',undefined,'profile-person-head',body); const picture=el('span',undefined,'profile-portrait',head);const seal=el('img',undefined,'',picture);seal.src=p.photo||'/assets/fib-seal.webp';seal.alt='';if(p.photo)picture.classList.add('has-photo');const summary=el('div',undefined,'profile-person-summary',head);
  el('span',label.profile,'profile-kicker',summary);
  el('h2',p.name,'',summary).id='profile-name';
  el('p',p.title,'profile-title',summary);
  const fields=el('div',undefined,'profile-fields',body);
  field(label.nationality,p.nationality,fields);field(label.age,p.age,fields);
  field(label.status,p.status||label.unpublished,fields);field(label.unit,p.unit||label.unpublished,fields);
  el('span',label.career,'profile-subhead',body);
  el('p',p.career||label.withheld,'profile-paragraph',body);
  el('span',label.biography,'profile-subhead',body);
  for(const paragraph of (p.biography||label.withheld).split(/\n\s*\n/).filter(Boolean)){el('p',paragraph.trim(),'profile-paragraph',body);}
  modal.showModal();
 }));
 document.getElementById('profile-close')?.addEventListener('click',()=>modal.close());
 modal.addEventListener('click',ev=>{if(ev.target===modal)modal.close();});
})();


// Very faint falling motes throughout the site. Decorative only; no assets or input capture.
(() => {
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches) return;
 const canvas=document.createElement('canvas');
 canvas.className='ambient-fall';
 canvas.setAttribute('aria-hidden','true');
 document.body.appendChild(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx){canvas.remove();return;}
 let width=0,height=0,scale=1,motes=[],frame=0,last=0;
 const rand=(lo,hi)=>lo+Math.random()*(hi-lo);
 function reset(fromTop=false){
  return {x:rand(0,width),y:fromTop?rand(-20,-3):rand(0,height),
   size:rand(.45,1.18),speed:rand(7,16),sway:rand(3,11),phase:rand(0,Math.PI*2),
   alpha:rand(.045,.12),warm:Math.random()<.20};
 }
 function resize(){
  width=window.innerWidth;height=window.innerHeight;
  scale=Math.min(window.devicePixelRatio||1,1.5);
  canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
  ctx.setTransform(scale,0,0,scale,0,0);
  motes=Array.from({length:Math.min(32,Math.max(12,Math.round(width*height/32000)))},()=>reset());
 }
 function draw(time){
  frame=0;
  if(document.hidden||motion.matches)return;
  const elapsed=Math.min((time-last)/1000,.07);
  if(elapsed<1/30){frame=requestAnimationFrame(draw);return;}
  last=time;
  ctx.clearRect(0,0,width,height);
  // The homepage cover photo stays completely clear; show only on dark sections.
  const hero=document.querySelector('.home .hero');
  if(hero&&hero.getBoundingClientRect().bottom>0){
   frame=requestAnimationFrame(draw);return;
  }
  for(const p of motes){
   p.y+=p.speed*elapsed;
   if(p.y>height+3)Object.assign(p,reset(true));
   const x=p.x+Math.sin(time*.00033+p.phase)*p.sway;
   ctx.beginPath();
   ctx.fillStyle=p.warm?`rgba(217,179,119,${p.alpha})`:`rgba(214,219,224,${p.alpha})`;
   ctx.arc(x,p.y,p.size,0,Math.PI*2);ctx.fill();
  }
  frame=requestAnimationFrame(draw);
 }
 function start(){if(frame||document.hidden||motion.matches)return;last=performance.now();frame=requestAnimationFrame(draw);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,width,height);}
 resize();start();
 window.addEventListener('resize',resize,{passive:true});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 motion.addEventListener('change',()=>motion.matches?stop():start());
})();

// Keyboard- and touch-friendly gallery with a native modal and graceful image-link fallback.
(() => {
 const gallery=document.querySelector('.unit-photo-gallery');
 const dialog=document.getElementById('unit-gallery-dialog');
 if(!gallery||!dialog||typeof dialog.showModal!=='function')return;
 const buttons=[...gallery.querySelectorAll('button.unit-gallery-thumb')];
 if(!buttons.length)return;
 const image=dialog.querySelector('.gallery-large-image');
 const counter=dialog.querySelector('.gallery-counter');
 const strip=dialog.querySelector('.gallery-strip');
 let position=0,touchStartX=null;
 function show(index){
  position=(index+buttons.length)%buttons.length;
  const source=buttons[position];
  image.src=source.dataset.gallerySrc;
  image.alt=source.querySelector('img')?.alt||'';
  counter.textContent=`${position+1} / ${buttons.length}`;
  [...strip.children].forEach((thumb,i)=>{
   thumb.setAttribute('aria-current',String(i===position));
   if(i===position) thumb.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
  });
 }
 function close(){dialog.close();}
 buttons.forEach((button,index)=>{
  const thumb=document.createElement('button');
  thumb.type='button';thumb.className='gallery-strip-thumb';
  thumb.setAttribute('aria-label',button.getAttribute('aria-label')||String(index+1));
  const small=document.createElement('img');small.src=button.dataset.gallerySrc;small.alt='';small.loading='lazy';
  thumb.appendChild(small);strip.appendChild(thumb);
  thumb.addEventListener('click',()=>show(index));
  button.addEventListener('click',()=>{show(index);dialog.showModal();});
 });
 dialog.querySelector('.gallery-close').addEventListener('click',close);
 dialog.querySelector('.gallery-prev').addEventListener('click',()=>show(position-1));
 dialog.querySelector('.gallery-next').addEventListener('click',()=>show(position+1));
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 dialog.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();show(position+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();show(position-1);}
 });
 image.addEventListener('touchstart',event=>{touchStartX=event.touches[0]?.clientX??null;},{passive:true});
 image.addEventListener('touchend',event=>{
  if(touchStartX===null)return;
  const delta=(event.changedTouches[0]?.clientX??touchStartX)-touchStartX;
  if(Math.abs(delta)>45)show(position+(delta<0?1:-1));
  touchStartX=null;
 },{passive:true});
})();
