import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderPage} from '../app/layout.mjs';
import {units} from '../app/content.mjs';

const css=await readFile(new URL('../styles.css',import.meta.url),'utf8');

test('division gallery contains exactly four linked photo cards without an extra CTA',()=>{
 for(const locale of ['uk','en','de']){
  const html=renderPage('units',locale);
  assert.equal((html.match(/class="division-article"/g)||[]).length,4);
  for(const u of units){
   assert.match(html,new RegExp(u.id==='csoa'?'assets/hero-csoa\\.webp':`assets/units/${u.id}\\.webp`));
   assert.ok(html.includes(`href="/${locale==='uk'?'':locale+'/'}units/${u.id}/"`));
  }
  assert.doesNotMatch(html,/Переглянути підрозділ|View division|Division ansehen|class="division-cta"/i);
 }
});

test('desktop division layout uses four columns and has gold hover outline',()=>{
 assert.match(css,/\/\* Division listing correction: all FOUR cards in one row on desktop/);
 const tail=css.split('/* Division listing correction: all FOUR cards in one row on desktop.')[1];
 assert.match(tail,/\.units-page \.division-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(tail,/\.units-page \.division-article::after\{[^}]*border:1px solid rgba\(230,186,119,\.88\)[^}]*opacity:0/);
 assert.match(tail,/\.units-page \.division-article:hover::after,\.units-page \.division-article:focus-visible::after\{opacity:1\}/);
 assert.match(tail,/@media\(max-width:800px\)\{\.units-page \.division-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/);
 assert.match(tail,/@media\(max-width:540px\)\{\.units-page \.division-grid\{grid-template-columns:1fr\}\}/);
});
