#!/usr/bin/env node
/**
 * publish.mjs
 * 编译完成后，将 out/ 目录中的发布文件复制到 release/ 目录
 * 包含：安装包(.dmg/.exe)、增量块(.blockmap)、更新配置(latest*.yml)
 * 用法：node scripts/publish.mjs
 */

import { readdir, copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'out');
const RELEASE_DIR = path.join(ROOT, 'release');

// 需要复制的文件：安装包、增量块、自动更新配置
const EXTENSIONS = ['.dmg', '.exe', '.zip', '.blockmap'];
const EXACT_NAMES = ['latest-mac.yml', 'latest.yml', 'latest-linux.yml'];

function shouldCopy(name) {
  const lower = name.toLowerCase();
  return EXTENSIONS.some(ext => lower.endsWith(ext)) || EXACT_NAMES.includes(name);
}

async function collectFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) continue; // 不递归，只取顶层文件
    if (shouldCopy(entry.name)) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    console.error(`❌  out/ 目录不存在，请先运行 npm run make`);
    process.exit(1);
  }

  await mkdir(RELEASE_DIR, { recursive: true });

  const files = await collectFiles(OUT_DIR);

  if (files.length === 0) {
    console.warn('⚠️  out/ 目录中未找到需要发布的文件');
    process.exit(0);
  }

  for (const src of files) {
    const dest = path.join(RELEASE_DIR, path.basename(src));
    await copyFile(src, dest);
    console.log(`✅  ${path.relative(ROOT, src)}  →  release/${path.basename(src)}`);
  }

  console.log(`\n🎉  共复制 ${files.length} 个文件到 release/`);
}

main().catch(err => {
  console.error('❌ ', err.message);
  process.exit(1);
});
