import {renderInterior,unitNames} from './interior.mjs';
import {translateHome} from './home-i18n.mjs';
import {nav, pages, units, external} from './content.mjs';

const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
let activeLocale='uk';
const tt=(uk,en,de)=>activeLocale==='en'?en:activeLocale==='de'?de:uk;
const route = slug => '/'+(activeLocale==='uk'?'':activeLocale+'/')+(slug?`${slug}/`:'' );
const eyebrow = label => `<span class="eyebrow">${esc(label)}</span>`;
const textLink = (label,url,cls='') => `<a class="text-link ${esc(cls)}" href="${esc(url)}">${esc(label)}</a>`;
const linkButton = (label,url,cls='') => `<a class="action-button ${esc(cls)}" href="${esc(url)}">${esc(label)}</a>`;
const regionTitle = (label,title) => `<div class="section-title">${eyebrow(label)}<h2>${title}</h2></div>`;

function header(active='') {
  const titles={ '':['Home','Startseite'],'bureau':['About','Über uns'],'units':['Divisions','Abteilungen'],'news':['News','Nachrichten'],'documents':['Documents','Dokumente'],'academy':['Academy','Akademie'],'contacts':['Contacts','Kontakt'],'join':['Join','Bewerbung']};
  const translateLabel=(n)=>activeLocale==='uk'?n.label:titles[n.slug][activeLocale==='en'?0:1];
  const links=nav.slice(0,-1).map(n=>`<a class="nav-link${n.slug===active?' current':''}" href="${route(n.slug)}"${n.slug===active?' aria-current="page"':''}>${esc(translateLabel(n))}</a>`).join('');
  const joinLabel=tt('Вступ','Join','Bewerbung');
  const langName=activeLocale==='en'?'English':activeLocale==='de'?'Deutsch':'Українська';
  const langs=[['uk','Українська'],['en','English'],['de','Deutsch']];
  const switcher=`<div class="language-dock" id="language-dock"><button type="button" class="language-toggle" id="language-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="language-options" aria-label="${tt('Змінити мову','Change language','Sprache ändern')}"><span class="language-current"><img src="/assets/flags/${activeLocale}.svg" class="flag-icon" alt="" width="25" height="17">${langName}</span><span class="language-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span></button><div class="language-options" id="language-options" hidden>${langs.map(([code,label])=>`<a href="/${code==='uk'?'':code+'/'}${windowPath(active)}" lang="${code}" hreflang="${code}"${activeLocale===code?' aria-current="true"':''}><img src="/assets/flags/${code}.svg" class="flag-icon" alt="" width="25" height="17">${label}</a>`).join('')}</div></div>`;
  return `<header class="site-header"><a class="brand" href="${route('')}" aria-label="FIB Olymp"><img src="/assets/fib-olymp-emblem-v52.webp" width="48" height="48" alt=""><span class="brand-type"><strong>FIB <span>OLYMP</span></strong><small>${tt('ФЕДЕРАЛЬНЕ БЮРО РОЗСЛІДУВАНЬ','FEDERAL INVESTIGATION BUREAU','BUNDESERMITTLUNGSBÜRO')}</small></span></a><div class="nav-shell"><nav id="main-nav" class="nav" aria-label="${tt('Головне меню','Main navigation','Hauptnavigation')}">${links}<a class="nav-link nav-join${active==='join'?' current':''}" href="${route('join')}"${active==='join'?' aria-current="page"':''}>${joinLabel}</a></nav></div><button id="menu-button" class="menu-button" aria-expanded="false" aria-controls="main-nav" aria-label="${tt('Відкрити меню','Open menu','Menü öffnen')}" type="button"><span></span><span></span><span></span></button></header>${switcher}`;
}
function windowPath(active){return active==='units' && currentSlug.startsWith('units/')?currentSlug+'/':currentSlug?currentSlug+'/':'';}
let currentSlug='';
function footer(){
  const labels={'':['Home','Startseite'],bureau:['About','Über uns'],units:['Divisions','Abteilungen'],news:['News','Nachrichten'],documents:['Documents','Dokumente'],academy:['Academy','Akademie'],contacts:['Contacts','Kontakt'],join:['Join','Bewerbung']};
  return `<footer class="site-footer"><div class="page-wrap footer-inner"><div><a class="footer-logo" href="${route('')}">FIB <span>OLYMP</span></a><p>${tt('Федеральне бюро розслідувань штату Olymp.','Federal Investigation Bureau, State of Olymp.','Federal Investigation Bureau, Staat Olymp.')}</p><div class="footer-social"><a href="${esc(external.discord)}" target="_blank" rel="noopener">Discord</a><a href="${esc(external.fibLaw)}" target="_blank" rel="noopener">${tt('Нормативна база','Legal framework','Rechtsgrundlagen')}</a></div></div><nav aria-label="${tt('Нижнє меню','Footer navigation','Fußnavigation')}">${nav.filter(x=>x.slug).map(x=>`<a href="${route(x.slug)}">${esc(activeLocale==='uk'?x.label:labels[x.slug][activeLocale==='en'?0:1])}</a>`).join('')}</nav><div class="footer-note">FIB OLYMP · ${tt('Публічний інформаційний портал','Public information portal','Öffentliches Informationsportal')}</div></div></footer>`;
}

function unitCards(){
  return `<div class="unit-grid">${units.map((u,i)=>`<a href="/units/${u.id}/" class="unit-item unit-item-${i+1}" aria-label="Відкрити сторінку ${esc(u.full)}"><div class="unit-photo" role="presentation" style="--unit-image:url('${u.id==='csoa'?'/assets/units/csoa-preview.webp':`/assets/units/${u.id}.webp`}')"></div><div class="unit-body"><span class="unit-pill">${esc(u.short)}</span><h3>${esc(u.name)}</h3><p>${esc(u.full)}</p></div></a>`).join('')}</div>`;
}

function home(){
  return `<main id="main" class="home">
<section class="hero" aria-labelledby="home-title"><div class="hero-picture" aria-hidden="true"></div><div class="hero-shade" aria-hidden="true"></div><div class="hero-copy"><span class="hero-kicker">ФЕДЕРАЛЬНЕ БЮРО РОЗСЛІДУВАНЬ · OLYMP</span><h1 id="home-title">ДИСЦИПЛІНА.<br>ЄДНІСТЬ.<br><span>РЕЗУЛЬТАТ.</span></h1><p>Тут починається шлях до служби. Дізнайся про підрозділи, підготовку та порядок вступу до FIB Olymp.</p><div class="hero-actions">${linkButton('Подати заявку','/join/','primary')}${linkButton('Дізнатися про бюро','/bureau/','ghost')}</div></div></section>
<section class="admissions-band page-wrap" aria-label="Вступ до FIB"><div class="admissions-band-copy">${eyebrow('Твій перший крок')}<h2>Хочеш служити <em>у FIB?</em></h2><p>Ознайомся з умовами, заповни анкету й перевіряй її статус на сайті.</p></div><div class="admissions-band-action">${linkButton('Перейти до вступу','/join/','primary')}<span>Анкета · Розгляд · Подальші етапи</span></div></section>
<section class="home-leadership page-wrap" aria-labelledby="home-bureau-title"><div class="home-leadership-left">${eyebrow('Про бюро')}<h2 id="home-bureau-title">Сильна структура.<br><em>Спільна<br>відповідальність.</em></h2></div><aside class="home-bureau-frame"><p>FIB Olymp об’єднує різні напрями роботи в одну систему. Тут цінують точність рішень, дисципліну та взаємодію між підрозділами.</p>${textLink('Докладніше про бюро','/bureau/','underlined')}</aside><div class="home-seal" aria-hidden="true"></div></section>
<section class="home-divisions"><div class="page-wrap"><div class="section-heading-row">${regionTitle('Структура бюро','Чотири підрозділи.<br><em>Одна служба.</em>')}<p>Кожен напрям має свою спеціалізацію. Натисни на фотографію, щоб дізнатися більше.</p></div>${unitCards()}</div></section>
<section class="home-academy page-wrap"><div class="home-academy-photo"><img src="/assets/academy.webp" alt="Співробітники FIB" loading="lazy"></div><div class="home-academy-copy">${eyebrow('Академія FIB')}<h2>Спочатку підготовка.<br><em>Потім служба.</em></h2><p>Вступ — це лише початок. Нові співробітники проходять навчання, знайомляться зі структурою та правилами взаємодії.</p>${textLink('Про навчання в Академії','/academy/','underlined')}</div></section>
<section class="home-public page-wrap"><div>${eyebrow('Публічна інформація')}<h2>Новини й <em>документи.</em></h2><p>Тут з’являтимуться тільки офіційно оприлюднені матеріали. Службовий архів не є частиною публічного сайту.</p></div><nav aria-label="Публічні розділи"><a href="/news/"><strong>Новини бюро</strong><span>Оголошення та повідомлення</span></a><a href="/documents/"><strong>Відкриті документи</strong><span>Публічний архів</span></a></nav></section>
<section class="home-end"><div class="page-wrap">${eyebrow('Підготовка та служба')}<h2>Твій наступний крок<br><em>починається тут.</em></h2><p>Усі потрібні відомості про вступ і навчання зібрані в окремих розділах.</p><div class="lift-links">${textLink('Про порядок вступу','/join/')}${textLink('Академія FIB','/academy/')}</div></div></section>
</main>`;
}

export function renderPage(slug='', locale='uk'){
  activeLocale=['uk','en','de'].includes(locale)?locale:'uk'; currentSlug=slug;
  const unit = units.find(u => slug === `units/${u.id}`);
  if (slug && !unit && !pages[slug]) throw new Error('Unknown page '+slug);
  // Every route has a unique, locale-specific browser-tab title.
  const routeTitles={
    uk:{'':'Головна',bureau:'Про бюро',units:'Підрозділи',news:'Новини',documents:'Документи',academy:'Академія',contacts:'Контакти',join:'Вступ',staff:'Розгляд заявок',invitation:'Запрошення'},
    en:{'':'Home',bureau:'About the bureau',units:'Divisions',news:'News',documents:'Documents',academy:'Academy',contacts:'Contacts',join:'Join',staff:'Applications',invitation:'Invitation'},
    de:{'':'Startseite',bureau:'Über das Büro',units:'Abteilungen',news:'Nachrichten',documents:'Dokumente',academy:'Akademie',contacts:'Kontakt',join:'Bewerbung',staff:'Bewerbungen',invitation:'Einladung'}
  };
  const pageName=unit ? unitNames[unit.id].full[activeLocale==='en'?1:activeLocale==='de'?2:0] : routeTitles[activeLocale][slug];
  const title=`FIB Olymp | ${pageName}`;
  const description = activeLocale!=='uk' ? (activeLocale==='en'?'FIB Olymp official information portal: departments, leadership, Academy and recruitment.':'Offizielles Informationsportal des FIB Olymp: Abteilungen, Leitung, Akademie und Bewerbung.') : unit ? `${unit.full}. ${unit.focus}` : slug ? pages[slug].description : 'Офіційний інформаційний портал FIB Olymp: структура, керівництво, Академія та вступ.';
  const rawContent = slug ? renderInterior(slug,activeLocale) : translateHome(home(),activeLocale);
  const content = !slug && activeLocale!=='uk' ? rawContent.replaceAll('href="/',`href="/${activeLocale}/`) : rawContent;
  const active = unit ? 'units' : slug;
  return `<!doctype html><html lang="${activeLocale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0b0c0d"><meta name="fib-build" content="Origin-5.5.0"><meta name="description" content="${esc(description)}"><meta name="color-scheme" content="dark"><title>${esc(title)}</title><link rel="icon" href="/assets/fib-olymp-emblem-v52.webp" type="image/webp"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Onest:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css?v=5.5.0"><script src="/app.js?v=5.5.0" defer></script></head><body class="${slug?'inner-layout':'home-layout'} route-${esc((slug||'home').replaceAll('/','-'))}"><a class="skip-link" href="#main">${tt('Перейти до вмісту','Skip to content','Zum Inhalt springen')}</a>${header(active)}${content}${footer()}</body></html>`;
}
