import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {renderPage} from '../app/layout.mjs';

const css = await readFile(new URL('../styles.css', import.meta.url),'utf8');

test('homepage public links contain no giant SVGs, while bureau introduction remains intact', () => {
  const html = renderPage('');
  const area = html.split('class="home-public page-wrap"')[1].split('</section>')[0];
  assert.doesNotMatch(area,/<svg|public-card-icon|public-card-news/);
  assert.match(area,/Новини бюро/);
  assert.match(area,/Відкриті документи/);
  assert.match(html,/class="home-bureau-frame"/);
  assert.match(css,/\.home \.admissions-band::after[^\n]*content:none!important/);
});

test('compact news, document and contact icons have explicit dimension safeguards', async () => {
  for (const slug of ['news','documents']) {
    const html = renderPage(slug);
    assert.match(html, /class="news-state-icon"/);
    assert.match(html, /<svg width="28" height="28"/);
    assert.match(css, /news-state-icon svg[^\n]*width:39px!important/);
  }
  const contacts = renderPage('contacts');
  for (const service of ['discord','instagram','tiktok']) {
    assert.match(contacts, new RegExp(`src="/assets/brands/${service}\\.svg"`));
    assert.ok((await stat(new URL(`../assets/brands/${service}.svg`, import.meta.url))).size > 500);
  }
  assert.match(css,/contact-card-icon svg,\.contacts-page \.contact-card-icon img/);
});
