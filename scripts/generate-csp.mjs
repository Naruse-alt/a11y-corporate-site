/**
 * dist/ のインライン script/style から CSP 用 SHA-256 を算出し、
 * workers/csp-policy.generated.js を生成（または --check で照合）する。
 *
 * 使い方:
 *   node scripts/generate-csp.mjs          # 生成して書き込み
 *   node scripts/generate-csp.mjs --check  # 既存ファイルと一致するか検証（CI 用）
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const outFile = path.join(root, 'workers/csp-policy.generated.js');

/**
 * @param {string} content
 * @returns {string}
 */
function sha256Csp(content) {
  const digest = createHash('sha256').update(content, 'utf8').digest('base64');
  return `'sha256-${digest}'`;
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function listHtmlFiles(dir) {
  /** @type {string[]} */
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listHtmlFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * @param {string} html
 * @param {'script' | 'style'} tag
 * @returns {string[]}
 */
function extractInline(html, tag) {
  const re =
    tag === 'script'
      ? /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
      : /<style[^>]*>([\s\S]*?)<\/style>/gi;
  /** @type {string[]} */
  const bodies = [];
  for (const match of html.matchAll(re)) {
    bodies.push(match[1]);
  }
  return bodies;
}

/**
 * @returns {Promise<string>}
 */
async function buildPolicy() {
  const htmlFiles = await listHtmlFiles(distDir);
  if (htmlFiles.length === 0) {
    throw new Error(`No HTML under ${distDir}. Run astro build first.`);
  }

  const scriptHashes = new Set();
  const styleHashes = new Set();

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const body of extractInline(html, 'script')) {
      scriptHashes.add(sha256Csp(body));
    }
    for (const body of extractInline(html, 'style')) {
      styleHashes.add(sha256Csp(body));
    }
  }

  if (scriptHashes.size === 0) {
    throw new Error('No inline scripts found in dist/; unexpected for this site.');
  }

  const scriptSrc = ["'self'", ...[...scriptHashes].sort()].join(' ');
  const styleSrc = ["'self'", ...[...styleHashes].sort()].join(' ');

  // unsafe-inline は使わない。インラインはハッシュのみ許可。
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self'",
    "font-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * @param {string} policy
 * @returns {string}
 */
function formatModule(policy) {
  return `/**
 * 自動生成ファイル。直接編集しないこと。
 * 生成: node scripts/generate-csp.mjs （astro build 後）
 */
export const CONTENT_SECURITY_POLICY = ${JSON.stringify(policy)};
`;
}

const checkOnly = process.argv.includes('--check');
const policy = await buildPolicy();
const next = formatModule(policy);

if (checkOnly) {
  let current = '';
  try {
    current = await readFile(outFile, 'utf8');
  } catch {
    console.error(`Missing ${outFile}. Run without --check to generate.`);
    process.exit(1);
  }
  if (current !== next) {
    console.error('CSP policy is out of date with dist/. Run: npm run build');
    process.exit(1);
  }
  console.log('CSP policy matches dist/ inline script/style hashes.');
  process.exit(0);
}

await writeFile(outFile, next, 'utf8');
console.log(`Wrote ${path.relative(root, outFile)}`);
console.log(`CSP: ${policy.slice(0, 120)}…`);
