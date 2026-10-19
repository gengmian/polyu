#!/usr/bin/env node
/* Static checks: translation completeness, asset references, timing sync. */
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (p) => readFile(path.join(root, p), 'utf8');
const problems = [];
const notes = [];

const html = await read('index.html');
const app = await read('assets/js/app.js');
const css = await read('assets/css/style.css');
const i18nSrc = await read('assets/js/i18n.js');

const sandbox = { window: {} };
vm.runInNewContext(i18nSrc, sandbox, { filename: 'i18n.js' });
const I18N = sandbox.window.NAILONG_I18N;
const DEST = sandbox.window.NAILONG_DEST;
const LANGS = ['zh-hans', 'zh-hant', 'en'];

if (!I18N || !DEST) {
  problems.push('i18n.js did not expose window.NAILONG_I18N / window.NAILONG_DEST');
}
for (const lang of LANGS) {
  if (!I18N?.[lang]) problems.push(`missing language block: ${lang}`);
  if (!DEST?.[lang]?.startsWith('https://www.polyu.edu.hk/')) problems.push(`bad destination for ${lang}`);
}

/* Keys referenced from HTML */
const htmlKeys = new Set(
  [...html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g)].map((m) => m[1])
);
/* Keys used only from JavaScript */
const runtimeKeys = ['hero.stayed', 'toast.stayed', 'hero.countdownOne'];

for (const lang of LANGS) {
  const dict = I18N?.[lang] || {};
  for (const key of [...htmlKeys, ...runtimeKeys]) {
    if (typeof dict[key] !== 'string' || dict[key].trim() === '') {
      problems.push(`${lang}: missing or empty "${key}"`);
    }
  }
}

/* Same key set everywhere */
const keySets = LANGS.map((l) => Object.keys(I18N?.[l] || {}).sort().join('\n'));
if (new Set(keySets).size !== 1) {
  const base = Object.keys(I18N?.[LANGS[0]] || {});
  for (const lang of LANGS.slice(1)) {
    const extra = Object.keys(I18N?.[lang] || {}).filter((k) => !base.includes(k));
    const missing = base.filter((k) => !(k in (I18N?.[lang] || {})));
    if (extra.length) notes.push(`${lang}: extra keys ${extra.join(', ')}`);
    if (missing.length) problems.push(`${lang}: missing keys ${missing.join(', ')}`);
  }
}

/* Referenced local assets exist */
const assetRefs = new Set(
  [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => decodeURIComponent(m[1]))
);
for (const ref of assetRefs) {
  try {
    await access(path.join(root, ref), constants.R_OK);
  } catch {
    problems.push(`missing asset: ${ref}`);
  }
}

for (const file of ['favicon.ico', 'site.webmanifest', 'robots.txt', 'assets/img/og.png', 'assets/img/apple-touch-icon.png']) {
  try {
    await access(path.join(root, file));
  } catch {
    problems.push(`missing file: ${file}`);
  }
}

/* Manifest icons must exist too */
try {
  const manifest = JSON.parse(await read('site.webmanifest'));
  for (const icon of manifest.icons || []) {
    try {
      await access(path.join(root, icon.src));
    } catch {
      problems.push(`missing manifest icon: ${icon.src}`);
    }
  }
} catch (error) {
  problems.push(`invalid site.webmanifest: ${error.message}`);
}

/* No external assets (fonts/scripts/images must be self-hosted) */
const externalAsset = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith('https://www.polyu.edu.hk/') && !u.startsWith('https://github.com/') && !u.startsWith('https://xn--psszg58csy9ayt3cnsh.com/'));
if (externalAsset.length) problems.push(`external asset references: ${externalAsset.join(', ')}`);

/* Redirect timing and CSS progress animation must agree */
const msMatch = app.match(/REDIRECT_MS = (\d+)/);
const cssMatch = css.match(/med-fill ([\d.]+)s/);
if (!msMatch || !cssMatch) {
  problems.push('could not read redirect timing (REDIRECT_MS / med-fill)');
} else if (Number(msMatch[1]) !== Math.round(Number(cssMatch[1]) * 1000)) {
  problems.push(`redirect timing mismatch: JS ${msMatch[1]}ms vs CSS ${Number(cssMatch[1]) * 1000}ms`);
}

/* Countdown label must be present for every language */
for (const lang of LANGS) {
  if (!I18N?.[lang]?.['hero.countdown']) problems.push(`${lang}: hero.countdown missing`);
}

/* Light sanity checks on the document */
for (const needle of ['<html lang=', 'name="viewport"', 'rel="icon"', 'site.webmanifest', 'noindex']) {
  if (!html.includes(needle)) problems.push(`index.html is missing ${needle}`);
}
if (!/og\.png/.test(html)) problems.push('og:image not referenced');

console.log(`Checked ${htmlKeys.size} HTML keys × ${LANGS.length} languages, ${assetRefs.size} local assets.`);
notes.forEach((n) => console.log('note: ' + n));
if (problems.length) {
  console.error('\n' + problems.map((p) => '✗ ' + p).join('\n'));
  process.exit(1);
}
console.log('✓ all checks passed');
