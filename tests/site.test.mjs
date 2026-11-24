import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {renderPage} from '../app/layout.mjs';
import {nav,pages,units,leadership,documentPosts} from '../app/content.mjs';
const root=new URL('../',import.meta.url);
const css=await readFile(new URL('styles.css',root),'utf8');
const js=await readFile(new URL('app.js',root),'utf8');
const routes=['',...Object.keys(pages),...units.map(u=>'units/'+u.id)];

test('14 public routes in each of three complete locale versions',async()=>{
 assert.equal(routes.length,14);
 assert.equal(nav.length,8);
 assert.ok(!nav.some(n=>n.slug==='activity'));
 for(const lang of ['uk','en','de'])for(const slug of routes){
  const html=renderPage(slug,lang);
  assert.match(html,new RegExp(`<html lang="${lang}">`));
  assert.match(html,/<main id="main"/);
  const prefix=lang==='uk'?'':lang+'/';
  assert.ok((await stat(new URL(`dist/${prefix}${slug?slug+'/':''}index.html`,root))).size>1700);
 }
 await assert.rejects(stat(new URL('dist/activity/index.html',root)),{code:'ENOENT'});
 assert.throws(()=>renderPage('activity'));
});

test('the original homepage structure, hero and assets remain',()=>{
 const html=renderPage('');
 for(const cls of ['hero','admissions-band','home-leadership','home-divisions','home-academy','home-public','home-end'])assert.match(html,new RegExp(`class="${cls}`));
 assert.match(html,/ДИСЦИПЛІНА/);
 assert.match(html,/Сильна структура\./);
 assert.match(html,/Спільна<br>відповідальність\./);
 assert.match(html,/class="home-bureau-frame"/);
 assert.match(html,/Докладніше про бюро/);
 assert.match(css,/\.home \.home-bureau-frame/);
 assert.match(css,/hero-csoa\.webp/);
 assert.doesNotMatch(html, /href="\/activity\/"/);
});

test('fixed flag selector switches to same localized route',()=>{
 const ua=renderPage('bureau','uk');
 assert.match(ua,/id="language-dock"/);
 assert.match(ua, /src="\/assets\/flags\/uk\.svg"[^>]*>Українська/);
 assert.match(ua, /src="\/assets\/flags\/en\.svg"/);
 assert.match(ua, /src="\/assets\/flags\/de\.svg"/);
 assert.doesNotMatch(ua, /🇺🇦|🇬🇧|🇩🇪/);
 assert.match(ua,/href="\/en\/bureau\/"/);
 assert.match(ua,/href="\/de\/bureau\/"/);
 assert.match(renderPage('units/csoa','en'),/href="\/de\/units\/csoa\/"/);
 assert.match(renderPage('join','de'),/href="\/en\/join\/"/);
 assert.match(js,/language-options/);
 assert.doesNotMatch(js,/full translation layer pending/);
});

test('English and German pages translate the main content, not only navigation',()=>{
 const tests=[['en','bureau','Bureau leadership'],['de','bureau','Behördenleitung'],['en','academy','Training <em>stages'],['de','academy','Ausbildung'],['en','join','Candidate'],['de','join','Bewerbung'],['en','documents','Published'],['de','documents','Veröffentlichte']];
 for(const [lang,slug,phrase]of tests)assert.match(renderPage(slug,lang),new RegExp(phrase,'i'));
 for(const lang of ['en','de']){
  assert.match(renderPage('',lang),lang==='en'?/DISCIPLINE/:/DISZIPLIN/);
  assert.match(renderPage('',lang),lang==='en'?/Strong structure\./:/Starke Struktur\./);
  assert.match(renderPage('',lang),lang==='en'?/More about the bureau/:/Mehr über die Behörde/);
  assert.match(renderPage('units/csoa',lang),lang==='en'?/Special Operations Center/:/Spezialeinsätze/);
 }
});

test('bureau position cards open the director bio modal and do not invent personnel',()=>{
 const html=renderPage('bureau');
 assert.equal(leadership.director.name,'Kai Muerte');
 assert.match(html,/class="leadership-tree"/);
 assert.match(html,/data-person="director"/);
 assert.match(html,/data-person="deputy-0"/);
 assert.match(html,/id="profile-dialog"/);
 assert.match(html,/id="leader-profiles"/);
 assert.match(js,/Національність/);
 assert.match(html,/Не оприлюднено/);
 assert.match(js,/modal\.showModal\(\)/);
 assert.match(js,/modal\.close\(\)/);
});

test('all four division routes and cards are linked',()=>{
 const html=renderPage('units');
 for(const u of units){
  assert.match(html,new RegExp(`href="/units/${u.id}/"`));
  assert.match(renderPage('units/'+u.id),new RegExp(`assets/units/${u.id}\\.webp`));
  const detail=renderPage('units/'+u.id);
  assert.doesNotMatch(detail,/Мінімальне звання|unit-selection|unit-back|unit-recruitment/);
  assert.match(detail,new RegExp(`assets/units/details/${u.id}\\.webp`));
  assert.match(detail,/Керівник/);
  assert.match(detail,/Заступник/);
 }
});

test('only published records are visible and no simulated news are invented',()=>{
 assert.equal(documentPosts.length,2);
 const html=renderPage('documents');
 for(const doc of documentPosts)assert.match(html,new RegExp(doc.href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.match(html,/class="news-state-icon"/);
 assert.doesNotMatch(html,/news-reference-links|ПУБЛІЧНИЙ РЕЄСТР/);
 const news=renderPage('news');
 assert.match(news,/class="news-state-icon"/);
 assert.doesNotMatch(news,/Пресцентр|Також може знадобитися|news-reference-links/);
});

test('recruitment form fields match the backend and staff access is server-backed',()=>{
 const html=renderPage('join');
 for(const key of ['name="rpName"','name="experience"','name="motivation"','name="consent"','id="application-availability"','id="application-form"','id="application-status-form"','id="application-success"'])assert.ok(html.includes(key),key);
 assert.match(js,/\/api\/applications/);
 assert.match(js,/\/api\/staff\/applications/);
 assert.match(js,/FIB_LANG/);
});

test('flat gray content panels and gray-filled hover nav, no permanent nav pill',()=>{
 assert.match(css,/language-dock\{position:fixed/);
 assert.match(css,/info-panel[^}]*background:#1b1d1f/);
 assert.match(css,/\.nav-link::before\{[^}]*opacity:0/);
 assert.match(css,/\.nav-link:hover::before/);
 assert.match(css,/\.nav-link\.current\{/);
 assert.match(css,/prefers-reduced-motion/);
});

test('one README and no stored production credentials',async()=>{
 const names=await readdir(root);
 assert.deepEqual(names.filter(x=>/^README/i.test(x)),['README.md']);
 assert.ok(!names.includes('.env'));
});


test('decorative section numbers removed on public interior pages',()=>{
 for(const slug of ['bureau','units','news','documents','academy','contacts','join',...units.map(u=>'units/'+u.id)]){
  for(const lg of ['uk','en','de']){
   const html=renderPage(slug,lg);
   assert.doesNotMatch(html, /class="eyebrow">\s*0[1-9]\s*\//);
   assert.doesNotMatch(html, /class="record-index"/);
   assert.doesNotMatch(html, /class="task-index"/);
  }
 }
});
test('external links survive, public management link is hidden, director portrait frame remains',()=>{
 for(const lg of ['uk','en','de']) {
  const contacts=renderPage('contacts',lg);
  assert.doesNotMatch(contacts,/href="\/(?:en\/|de\/)?staff\/"/);
  assert.match(contacts,/Discord/);
  const news=renderPage('news',lg);
  assert.doesNotMatch(news,/news-reference-links/);
  assert.doesNotMatch(news, /↗|✦|class="publication-symbol"/);
  const bureau=renderPage('bureau',lg);
  assert.match(bureau,/leader-portrait/);
  assert.match(bureau,/profile-trigger/);
 }
 assert.match(css,/leader-card::after/);
 assert.match(css,/border:1px solid rgba\(205,166,103/);
});


test('press and documents pages use centered icons without excess navigation and borders',()=>{
 for(const lg of ['uk','en','de']){
  const news=renderPage('news',lg);
  assert.match(news,/class="news-empty-state"/);
  assert.doesNotMatch(news,/class="news-reference-items"/);
  assert.doesNotMatch(news,/class="resource-link"|class="publication-symbol"|class="publication-placeholder"|↗|✦/);
  const docs=renderPage('documents',lg);
  assert.match(docs,/class="record-list"/);
  assert.doesNotMatch(docs,/class="record-out"|class="record-icon"/);
 }
});

test('each department has restored original photographic editorial composition, unboxed responsibility list and translation',()=>{
 for(const u of units)for(const lg of ['uk','en','de']){
  const h=renderPage('units/'+u.id,lg);
  assert.match(h,/class="page-wrap unit-feature"/);
  assert.match(h,new RegExp('assets/units/'+u.id+'\\.webp'));
  assert.match(h,/class="unit-responsibilities"/);
  assert.doesNotMatch(h,/class="task-tile"|class="task-grid"|✦/);
 }
});

test('public individual division pages hide selection details, but academy discloses published internal ranks',()=>{
 for(const lang of ['uk','en','de'])for(const u of units){
  const html=renderPage('units/'+u.id,lang);
  assert.doesNotMatch(html,/unit-selection|unit-recruitment|unit-back/);
  assert.match(html,new RegExp(`assets/units/details/${u.id}\\.webp`));
 }
 const academy=renderPage('academy');
 assert.match(academy,/class="training-step"/);
 assert.match(academy,/Senior Agent/);
 assert.match(academy,/Senior Agent <span>\(4\)<\/span>/);
 assert.match(academy,/Agent <span>\(3\)<\/span>/);
 assert.match(academy,/<div class="training-grid" role="list">/);
 assert.equal((academy.match(/class="training-stage" role="listitem"/g)||[]).length,6);
 assert.doesNotMatch(academy,/<ol class="training-grid"/);
});

test('compact public placeholders and contacts have no oversized decorative icons or fake social links',()=>{
 const news=renderPage('news');
 assert.doesNotMatch(news,/Пресцентр|Також може знадобитися/);
 const docs=renderPage('documents');
 assert.doesNotMatch(docs,/news-reference-links|Публічний реєстр/);
 const contacts=renderPage('contacts');
 assert.match(contacts,/assets\/brands\/discord.svg/);
 assert.match(contacts,/assets\/brands\/instagram.svg/);
 assert.match(contacts,/assets\/brands\/tiktok.svg/);
 assert.doesNotMatch(contacts,/href="https:\/\/instagram.com\/"|href="https:\/\/tiktok.com\/"/);
 assert.match(css,/\.nav-link\.current:hover::before/);
});

test('dossier cards do not display extra combined position text',()=>{
 const page=renderPage('bureau');
 assert.match(page,/profile-trigger/);
 assert.doesNotMatch(page,/Директор FIB · Керівник ЦСО/);
 assert.match(page,/Директор FIB/);
});

test('each page and language has its own browser title, with versioned assets',()=>{
 for(const locale of ['uk','en','de']){
  const titles=new Set();
  for(const slug of routes){
   const html=renderPage(slug,locale);
   const match=html.match(/<title>([^<]+)<\/title>/);
   assert.ok(match,`${locale}:${slug} must have a title`);
   assert.match(match[1],/^FIB Olymp \| /);
   assert.ok(!titles.has(match[1]),`${locale}:${slug} repeats a title`);
   titles.add(match[1]);
   assert.match(html,/\/app\.js\?v=5\.4\.0/);
  }
 }
});

test('bureau keeps portrait cards but no organizational connector strokes',()=>{
 const html=renderPage('bureau');
 assert.equal((html.match(/class="leader-card profile-trigger/g)||[]).length,8);
 assert.doesNotMatch(html,/class="tree-stem/);
 assert.match(css,/\.bureau-page \.tree-stem,[\s\S]*?\.bureau-page \.tree-node::after\{[\s\S]*?display:none!important/);
 assert.match(css,/\.bureau-page \.leader-card \.leader-portrait/);
});

test('gallery dialog is controlled within the site, with only image, arrows and close',()=>{
 const html=renderPage('units/csoa');
 assert.match(html,/class="unit-gallery-dialog"/);
 assert.match(html,/class="gallery-nav gallery-prev"/);
 assert.match(html,/class="gallery-nav gallery-next"/);
 assert.match(html,/class="gallery-close"/);
 assert.doesNotMatch(html,/class="gallery-strip"|class="gallery-counter"/);
 assert.match(js,/dialog\.showModal\(\)/);
 assert.match(js,/dataset\.gallerySrc/);
});

test('academy requirements remain explicit without oversized repeated numerals',()=>{
 const html=renderPage('academy');
 assert.equal((html.match(/class="rank-entry"/g)||[]).length,2);
 assert.doesNotMatch(html,/rank-entry-number/);
 assert.match(html,/Senior Agent <span>\(4\)<\/span>/);
 assert.match(html,/Agent <span>\(3\)<\/span>/);
});
