#!/usr/bin/env node
// Upserts one project into data/projects.json.
//
//   node scripts/add-project.mjs --json '{"title":"...","blurb":"..."}'
//   node scripts/add-project.mjs --file entry.json
//   cat entry.json | node scripts/add-project.mjs
//
// Matching is by slug. A new slug is appended; an existing one is PATCHED —
// only the fields present in the input change, so a partial update such as
// {"title":"X","status":"shipped"} keeps the existing tags, links and date.
// Flags: --dry-run (print, write nothing), --replace (overwrite wholesale).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'data/projects.json');
const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : args[args.indexOf(hit) + 1];
};
const has = (name) => args.includes(`--${name}`);
const die = (msg) => { console.error(`add-project: ${msg}`); process.exit(1); };

const slugify = (s) => String(s).toLowerCase().trim()
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '').slice(0, 60);

async function readInput() {
  const inline = flag('json');
  if (inline) return inline;
  const file = flag('file');
  if (file) return readFileSync(file, 'utf8');
  if (process.stdin.isTTY) die('no input. Pass --json, --file, or pipe JSON on stdin.');
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

let input;
try { input = JSON.parse(await readInput()); }
catch (e) { die(`input is not valid JSON — ${e.message}`); }
if (Array.isArray(input)) die('expected a single project object, not an array.');
if (!input || typeof input !== 'object') die('expected a JSON object.');

const given = new Set(Object.keys(input));
if (!given.has('title') || !String(input.title).trim()) die('"title" is required.');

const slug = slugify(input.slug || input.title);
if (!slug) die(`could not derive a slug from "${input.title}".`);
if (given.has('date') && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
  die(`"date" must be YYYY-MM-DD, got "${input.date}".`);
}
for (const listField of ['tags', 'highlights']) {
  if (given.has(listField) && !Array.isArray(input[listField])) {
    die(`"${listField}" must be an array of strings.`);
  }
}

const projects = JSON.parse(readFileSync(FILE, 'utf8'));
const at = projects.findIndex((p) => p.slug === slug);

let action, result;
if (at === -1 || has('replace')) {
  // A whole entry: fill in the fields the input left out.
  if (!input.blurb || !String(input.blurb).trim()) die('"blurb" is required for a new project.');
  result = {
    slug,
    title: input.title,
    blurb: input.blurb,
    date: input.date || new Date().toISOString().slice(0, 10),
    status: input.status || 'weekend build',
    tags: input.tags || [],
    links: { repo: '', demo: '', ...(input.links || {}) },
    highlights: input.highlights || [],
    body: input.body || '',
  };
  if (at === -1) { projects.push(result); action = 'added'; }
  else { projects[at] = result; action = 'replaced'; }
} else {
  // A patch: touch only what the caller actually supplied.
  const kept = projects[at];
  const patch = { slug };
  for (const key of given) {
    if (key === 'links' || key === 'slug') continue;
    patch[key] = input[key];
  }
  if (given.has('links')) patch.links = { ...(kept.links || {}), ...input.links };
  result = { ...kept, ...patch };
  projects[at] = result;
  action = 'updated';
}

const out = JSON.stringify(projects, null, 2) + '\n';
const summary = `${action} "${result.title}" (slug: ${slug}, date: ${result.date})`;
if (has('dry-run')) {
  console.log(out);
  console.error(`add-project: would have ${summary} — dry run, nothing written.`);
} else {
  writeFileSync(FILE, out);
  console.log(`add-project: ${summary}. ${projects.length} projects total.`);
}
