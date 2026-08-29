#!/usr/bin/env node
// WCAG 2.x コントラスト比の検証ツール。
//
// なぜ自作か:
//   AGENTS.md の絶対規則により、色のコントラスト比は「推測・暗算で書かない」。
//   数値は必ずこのスクリプトの出力を根拠とする。したがって設計トークン
//   (src/styles/tokens.css) を単一の情報源として読み取り、意味のある
//   前景/背景ペアを機械的に判定する。
//
// 使い方:
//   node scripts/contrast.mjs                # 既定のペア定義を検証
//   node scripts/contrast.mjs "#1a1a1a" "#ffffff"  # 任意の2色を検証
//
// 判定基準 (WCAG 2.2):
//   1.4.3 コントラスト(最低限) AA  : 通常テキスト 4.5:1 / 大きなテキスト 3:1
//   1.4.6 コントラスト(高度)   AAA : 通常テキスト 7:1 / 大きなテキスト 4.5:1
//   1.4.11 非テキストのコントラスト AA : UI部品・境界 3:1

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TOKENS_PATH = join(ROOT, 'src', 'styles', 'tokens.css');
const CONFIG_PATH = join(__dirname, 'contrast.config.json');

/** #rgb / #rrggbb を {r,g,b} (0-255) へ変換 */
function parseHex(hex) {
  const v = hex.trim().replace(/^#/, '');
  if (v.length === 3) {
    const r = parseInt(v[0] + v[0], 16);
    const g = parseInt(v[1] + v[1], 16);
    const b = parseInt(v[2] + v[2], 16);
    return { r, g, b };
  }
  if (v.length === 6) {
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return { r, g, b };
  }
  throw new Error(`色の形式を解釈できません: ${hex}`);
}

/** sRGB 1チャンネルを相対輝度用の線形値へ変換 */
function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** 相対輝度 (WCAG 定義) */
function relativeLuminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** コントラスト比 (常に >= 1) */
function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(parseHex(fgHex));
  const l2 = relativeLuminance(parseHex(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * バランスの取れた @media / @supports などのアットルールブロックを丸ごと除去する。
 * これによりアットルール内にネストした :root が最上位の :root と混同されるのを防ぐ。
 */
function stripAtRuleBlocks(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (css[i] === '@') {
      // 次の '{' までをアットルールのプレリュードとして読み飛ばし、対応する '}' まで捨てる
      let j = i;
      while (j < css.length && css[j] !== '{' && css[j] !== ';') j++;
      if (css[j] === ';') {
        // @import 等のブロックを持たないアットルール
        i = j + 1;
        continue;
      }
      let depth = 0;
      while (j < css.length) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
        j++;
      }
      i = j;
      continue;
    }
    out += css[i];
    i++;
  }
  return out;
}

/**
 * tokens.css からスコープごとに --color-* のカスタムプロパティを抽出する。
 *   - light: 最上位の :root
 *   - dark : :root[data-theme="dark"]
 * OS 追従の @media ブロックは値が重複しているため解析対象から除外する。
 * var() 参照にも1段階だけ対応する。
 */
async function loadTokens() {
  const raw = await readFile(TOKENS_PATH, 'utf8');
  // コメントを先に除去する。コメント内の @media 等がパーサを誤動作させないため。
  const withoutComments = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const css = stripAtRuleBlocks(withoutComments);
  const scopes = { light: {}, dark: {} };

  // ブロック単位で走査する簡易パーサ。セレクタ -> 宣言ブロック。
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(css)) !== null) {
    const selector = m[1].trim();
    const body = m[2];
    const decls = {};
    const declRe = /(--color-[\w-]+)\s*:\s*([^;]+);/g;
    let d;
    while ((d = declRe.exec(body)) !== null) {
      decls[d[1]] = d[2].trim();
    }
    if (Object.keys(decls).length === 0) continue;
    if (/data-theme\s*=\s*["']?dark/.test(selector)) {
      Object.assign(scopes.dark, decls);
    } else if (/data-theme\s*=\s*["']?light/.test(selector)) {
      Object.assign(scopes.light, decls);
    } else if (/^:root$/.test(selector)) {
      Object.assign(scopes.light, decls);
    }
  }

  // var() を1段階解決 (dark は light を継承する想定でフォールバック)
  const resolve = (scopeName) => {
    const base = { ...scopes.light, ...scopes[scopeName] };
    const out = {};
    for (const [key, raw] of Object.entries(base)) {
      const varMatch = raw.match(/var\(\s*(--[\w-]+)\s*\)/);
      out[key] = varMatch ? base[varMatch[1]] ?? raw : raw;
    }
    return out;
  };

  return { light: resolve('light'), dark: resolve('dark') };
}

function thresholdFor(level) {
  switch (level) {
    case 'AA-large':
      return { label: 'AA 大きなテキスト(3:1)', min: 3.0 };
    case 'AAA':
      return { label: 'AAA 通常テキスト(7:1)', min: 7.0 };
    case 'UI':
      return { label: 'AA 非テキスト(3:1)', min: 3.0 };
    case 'AA':
    default:
      return { label: 'AA 通常テキスト(4.5:1)', min: 4.5 };
  }
}

function fmt(n) {
  return n.toFixed(2);
}

async function runPairs() {
  const tokens = await loadTokens();
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));

  let failures = 0;
  let total = 0;

  for (const scopeName of Object.keys(config)) {
    const scopeTokens = tokens[scopeName];
    if (!scopeTokens) {
      console.error(`未知のスコープです: ${scopeName}`);
      failures++;
      continue;
    }
    console.log(`\n== ${scopeName === 'light' ? 'ライトモード' : 'ダークモード'} ==`);
    for (const pair of config[scopeName]) {
      total++;
      const fg = scopeTokens[pair.fg];
      const bg = scopeTokens[pair.bg];
      if (!fg || !bg) {
        console.log(`  [欠落] ${pair.name}: トークン ${!fg ? pair.fg : pair.bg} が見つかりません`);
        failures++;
        continue;
      }
      const ratio = contrastRatio(fg, bg);
      const { label, min } = thresholdFor(pair.level);
      const pass = ratio >= min;
      if (!pass) failures++;
      const mark = pass ? 'PASS' : 'FAIL';
      console.log(
        `  [${mark}] ${pair.name}: ${ratio.toFixed(2)}:1 ` +
          `(${pair.fg} ${fg} / ${pair.bg} ${bg}) 基準 ${label}`
      );
    }
  }

  console.log(`\n合計 ${total} 件 / 不合格 ${failures} 件`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

async function runAdHoc(fg, bg) {
  const ratio = contrastRatio(fg, bg);
  console.log(`${fg} / ${bg} = ${fmt(ratio)}:1`);
  console.log(`  AA 通常(4.5:1)   : ${ratio >= 4.5 ? 'PASS' : 'FAIL'}`);
  console.log(`  AA 大きい(3:1)   : ${ratio >= 3.0 ? 'PASS' : 'FAIL'}`);
  console.log(`  AAA 通常(7:1)    : ${ratio >= 7.0 ? 'PASS' : 'FAIL'}`);
  console.log(`  非テキスト(3:1)  : ${ratio >= 3.0 ? 'PASS' : 'FAIL'}`);
}

const [, , argA, argB] = process.argv;
if (argA && argB) {
  await runAdHoc(argA, argB);
} else {
  await runPairs();
}
