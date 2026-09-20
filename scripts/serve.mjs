#!/usr/bin/env node
// Zero-dependency static server for dist/, with rebuild-on-change.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4321;
const PREVIEW = !process.argv.includes('--no-preview');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2',
};

function rebuild(reason) {
  const r = spawnSync(process.execPath,
    ['scripts/build.mjs', ...(PREVIEW ? ['--preview'] : [])],
    { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) console.error(r.stderr || r.stdout);
  else process.stdout.write(`${reason ? reason + ' -> ' : ''}${(r.stdout || '').trim()}\n`);
}

let timer = null;
for (const dir of ['data', 'src', 'assets']) {
  try {
    watch(join(ROOT, dir), { recursive: true }, (_e, file) => {
      clearTimeout(timer);
      timer = setTimeout(() => rebuild(`${dir}/${file}`), 80);
    });
  } catch { /* watching is a convenience; ignore if unsupported */ }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    // Keep requests inside dist/.
    const full = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
    if (!full.startsWith(DIST)) { res.writeHead(403).end('Forbidden'); return; }

    let target = full;
    try {
      if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
    } catch {
      if (!extname(target)) target = full + '/index.html';
    }
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
       .end('<h1>404</h1><p><a href="/">Back to the front page</a></p>');
  }
}).listen(PORT, () => {
  console.log(`Serving dist/ on http://localhost:${PORT}`);
});
