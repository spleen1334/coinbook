// Builds the app for both the root path and the GitHub Pages /coinbook/ base
// path, then checks the output for PWA artifact correctness: manifest and
// service worker presence, icon files actually on disk, no duplicate
// manifest/font tags in the built HTML, and every asset reference correctly
// rewritten under the configured base path.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

const targets = [
  { label: 'root path (/)', basePath: '/', env: {} },
  { label: 'GitHub Pages path (/coinbook/)', basePath: '/coinbook/', env: { VITE_BASE_PATH: '/coinbook/' } }
];

let failures = 0;

function fail(message) {
  failures++;
  console.error(`  ✗ ${message}`);
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

function checkFileExists(relPath, label) {
  const full = join(DIST, relPath);
  if (existsSync(full)) {
    pass(`${label} exists (${relPath})`);
  } else {
    fail(`${label} missing (${relPath})`);
  }
}

function countOccurrences(haystack, pattern) {
  return (haystack.match(pattern) || []).length;
}

for (const { label, basePath, env } of targets) {
  console.log(`\nBuilding for ${label}...`);
  rmSync(DIST, { recursive: true, force: true });
  execFileSync('npx', ['vite', 'build'], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: 'inherit'
  });

  console.log(`Verifying ${label}:`);

  checkFileExists('manifest.webmanifest', 'PWA manifest');
  checkFileExists('sw.js', 'Service worker');
  checkFileExists('icons/icon-192.png', '192x192 icon');
  checkFileExists('icons/icon-512.png', '512x512 icon');
  checkFileExists('icons/icon-maskable-512.png', 'maskable icon');
  checkFileExists('index.html', 'index.html');

  const indexPath = join(DIST, 'index.html');
  if (!existsSync(indexPath)) continue;
  const html = readFileSync(indexPath, 'utf8');

  const manifestLinkCount = countOccurrences(html, /<link[^>]*rel="manifest"/g);
  if (manifestLinkCount === 1) {
    pass('exactly one <link rel="manifest"> tag (no duplicate)');
  } else {
    fail(`expected exactly one manifest link, found ${manifestLinkCount}`);
  }

  const fontStylesheetCount = countOccurrences(html, /fonts\.googleapis\.com\/css2[^"]*"\s*rel="stylesheet"/g);
  if (fontStylesheetCount === 1) {
    pass('exactly one Google Fonts stylesheet link (no duplicate)');
  } else {
    fail(`expected exactly one font stylesheet link, found ${fontStylesheetCount}`);
  }

  const srcHrefValues = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((v) => v.startsWith('/') && !v.startsWith('//'));
  const misplacedAssets = srcHrefValues.filter((v) => !v.startsWith(basePath) && !v.startsWith('https://'));
  if (misplacedAssets.length === 0) {
    pass(`all local asset references are rooted under ${basePath}`);
  } else {
    fail(`asset references not rooted under ${basePath}: ${misplacedAssets.join(', ')}`);
  }

  const manifestPath = join(DIST, 'manifest.webmanifest');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.start_url === basePath && manifest.scope === basePath) {
      pass(`manifest start_url/scope match base path (${basePath})`);
    } else {
      fail(`manifest start_url/scope do not match base path: start_url=${manifest.start_url}, scope=${manifest.scope}`);
    }
    for (const icon of manifest.icons || []) {
      checkFileExists(icon.src, `manifest icon referenced (${icon.src})`);
    }
  }
}

rmSync(DIST, { recursive: true, force: true });

console.log('');
if (failures > 0) {
  console.error(`FAILED: ${failures} check(s) did not pass.`);
  process.exit(1);
} else {
  console.log('All PWA build checks passed for both base paths.');
}
