import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {renderPage} from '../app/layout.mjs';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const routes=['','bureau','units','units/csoa','units/dkb','units/gsu','units/gur','news','documents','academy','contacts','join','staff','invitation'];
const localeNames=['uk','en','de'];
const htmlMain=html=>html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0]||'';
const plain=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|quot|lt|gt|#39);/g,' ').replace(/\s+/g,' ').trim();
const tagCounts=(html)=>Object.fromEntries(['h1','h2','h3','p','li','a','button','input','form','img'].map(tag=>[tag,(html.match(new RegExp(`<${tag}(?=[\\s>/])`,'g'))||[]).length]));
const cyr=/[А-Яа-яІіЇїЄєҐґ]/;

test('all 42 routes retain identical content structure in Ukrainian, English and German',()=>{
 for(const route of routes){
  const pages=localeNames.map(locale=>renderPage(route,locale));
  const basics=tagCounts(htmlMain(pages[0]));
  for(let i=0;i<3;i++){
   assert.match(pages[i],new RegExp(`<html lang="${localeNames[i]}">`),`language ${route}`);
   assert.match(pages[i],/<title>FIB Olymp \| /,`tab title ${route}`);
   assert.deepEqual(tagCounts(htmlMain(pages[i])),basics,`${route} structure ${localeNames[i]}`);
   assert.ok(plain(htmlMain(pages[i])).length>0,`${route} page has text ${localeNames[i]}`);
   if(i){
    const body=htmlMain(pages[i]).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
    assert.equal(cyr.test(plain(body)),false,`${route} has untranslated displayed text in ${localeNames[i]}`);
    for(const attr of body.matchAll(/(?:alt|aria-label|placeholder|title)="([^"]*)"/g))
      assert.equal(cyr.test(attr[1]),false,`${route} has untranslated attribute ${attr[1]} in ${localeNames[i]}`);
   }
  }
 }
});

test('Kai Muerte biography is complete and preserves six paragraphs in all languages',()=>{
 const lengths=[];
 for(const locale of localeNames){
  const html=renderPage('bureau',locale);
  const embedded=html.match(/<script id="leader-profiles" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(embedded,`profiles JSON exists for ${locale}`);
  const profiles=JSON.parse(embedded[1]);
  const director=profiles.find(p=>p.id==='director');
  const csoa=profiles.find(p=>p.id==='head-csoa');
  assert.ok(director?.biography);
  const paragraphs=director.biography.trim().split(/\n\s*\n/);
  assert.equal(paragraphs.length,6,`${locale} must have all six biography paragraphs`);
  assert.ok(paragraphs.every(p=>p.length>130),`${locale} must have unabridged paragraphs`);
  assert.equal(csoa.biography,director.biography,`${locale} biography in division-head dossier`);
  if(locale!=='uk')assert.equal(cyr.test(director.biography),false,`${locale} biography fully translated`);
  lengths.push(director.biography.length);
 }
 assert.ok(lengths[1]>lengths[0]*0.75,'English bio is not shorter than source');
 assert.ok(lengths[2]>lengths[0]*0.75,'German bio is not shorter than source');
});

test('server-side recruitment errors all have English and German equivalents',()=>{
 const js=readFileSync(join(root,'app.js'),'utf8');
 const block=js.slice(js.indexOf('const FIB_LANG='),js.indexOf('// Mobile navigation'));
 const backend=readFileSync(join(root,'lib/recruitment.mjs'),'utf8');
 const messages=[...new Set([...backend.matchAll(/(?:error:\s*|new Error\()'([^'\n]+)'/g)].map(m=>m[1]))];
 for(const locale of ['en','de']){
  const context={document:{documentElement:{lang:locale}}};
  vm.runInNewContext(block+'\nthis.translate=fibRuntimeTranslate;',context);
  for(const message of messages){
   const translated=context.translate(message);
   assert.ok(translated,`non-empty message ${message}`);
   if(cyr.test(message))assert.equal(cyr.test(translated),false,`${locale} backend message untranslated: ${message}`);
   if(locale==='de'&&!cyr.test(message)) assert.notEqual(translated,message,`German server message untranslated: ${message}`);
  }
 }
});
