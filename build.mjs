/** Generate the single public build in dist/. No generated HTML is kept in source folders. */
import { mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { renderPage } from './app/layout.mjs';
import { pages, units } from './app/content.mjs';

const root = new URL('.', import.meta.url);
const dist = new URL('dist/', root);
const basePath = process.env.SITE_BASE_PATH || '/';
if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(basePath)) {
  throw new Error('SITE_BASE_PATH must be / or a path like /repository/');
}

// The optional prefix lets GitHub Pages serve a project repository in a subfolder.
function prefixPublicPaths(content) {
  if (basePath === '/') return content;
  return content
    .replaceAll('="/', `="${basePath}`)
    .replaceAll("url('/assets/", `url('${basePath}assets/`);
}

const routes = ['', ...Object.keys(pages), ...units.map(unit => `units/${unit.id}`)];
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const locale of ['uk', 'en', 'de']) {
  for (const slug of routes) {
    const target = new URL(`${locale === 'uk' ? '' : `${locale}/`}${slug ? `${slug}/` : ''}`, dist);
    await mkdir(target, { recursive: true });
    await writeFile(new URL('index.html', target), prefixPublicPaths(renderPage(slug, locale)));
  }
}

await cp(new URL('assets/', root), new URL('assets/', dist), { recursive: true });
const css = await readFile(new URL('styles.css', root), 'utf8');
await writeFile(new URL('styles.css', dist), prefixPublicPaths(css));
await cp(new URL('app.js', root), new URL('app.js', dist));
await cp(new URL('cabinet/', root), new URL('cabinet/', dist), {recursive:true});
console.log(`Built ${routes.length * 3} localized pages in dist/ (base path ${basePath}).`);
