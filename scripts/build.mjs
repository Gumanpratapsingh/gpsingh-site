#!/usr/bin/env node
// Builds the static site into dist/.
//   node scripts/build.mjs            -> production build, theme from site.config.json
//   node scripts/build.mjs --preview  -> adds the local theme-switcher bar
//   node scripts/build.mjs --theme=gazette
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndex, renderProject, THEMES } from '../src/templates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const themeArg = (args.find((a) => a.startsWith('--theme=')) || '').split('=')[1];

const config = readJSON('site.config.json');
const profile = readJSON('data/profile.json');
const projects = readJSON('data/projects.json');

const theme = themeArg || config.theme || 'atomic';
if (!THEMES.some((t) => t.id === theme)) {
  console.error(`Unknown theme "${theme}". Valid: ${THEMES.map((t) => t.id).join(', ')}`);
  process.exit(1);
}

// Number projects oldest-first so an entry keeps its number forever,
// then display newest-first.
const byDateAsc = [...projects].sort((a, b) => String(a.date).localeCompare(String(b.date)));
byDateAsc.forEach((p, i) => { p.no = String(i + 1).padStart(3, '0'); });
const ordered = [...byDateAsc].reverse();

const OUT = join(ROOT, config.outDir || 'dist');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const write = (rel, html) => {
  const full = join(OUT, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
};

write('index.html', renderIndex({ profile, projects: ordered, theme, preview }));
for (const project of ordered) {
  write(join('projects', project.slug, 'index.html'),
        renderProject({ profile, project, theme, preview }));
}

cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });
writeFileSync(join(OUT, '.nojekyll'), '');
if (existsSync(join(ROOT, 'CNAME'))) cpSync(join(ROOT, 'CNAME'), join(OUT, 'CNAME'));

console.log(`Built ${ordered.length + 1} pages into ${config.outDir || 'dist'}/  (theme: ${theme}${preview ? ', preview' : ''})`);
