import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../app/layout.mjs';

const expected = {
  gsu: ['agent1.jpg','agent2.webp','agent3.webp','agent4.png','agent5.png','agent6.webp','gsu.webp'],
  gur: ['gur1.webp','gur2.webp','gur3.webp','gur4.webp','gur5.jpg','gur6.jpg','gur.webp'],
  dkb: ['cyber1.webp','cyber2.jpg','cyber3.png','cyber4.webp','cyber5.jpg','cyber6.png'],
  csoa: ['csoa1.webp','csoa2.webp','csoa3.webp','csoa4.webp','csoa5.webp','csoa6.webp',
    'csoa%20(1).png','csoa%20(1).webp','csoa%20(2).png','csoa%20(3).webp','csoa%20(4).webp','csoa.webp']
};

test('all four galleries contain individually ordered, nonrepeating photos across languages',()=>{
 for(const locale of ['uk','en','de'])for(const [id,names] of Object.entries(expected)){
   const html=renderPage(`units/${id}`,locale);
   const filenames=[...html.matchAll(/data-gallery-src="([^"]+)"/g)].map(m=>decodeURIComponent(m[1].split('/').at(-1)));
   assert.deepEqual(filenames,names.map(decodeURIComponent),`${id} ${locale}`);
   const indexes=[...html.matchAll(/data-gallery-index="(\d+)"/g)].map(m=>Number(m[1]));
   assert.deepEqual(indexes,Array.from({length:names.length},(_,i)=>i));
   assert.equal(new Set(filenames).size,filenames.length);
 }
});
