#!/usr/bin/env node
/**
 * 生成 electron-updater 所需的 YAML 清单文件
 *
 * 用法:
 *   node scripts/generate-update-manifest.mjs --version 1.0.20
 *
 * 输出:
 *   out/latest-mac.yml  - macOS 更新清单
 *   out/latest.yml      - Windows 更新清单
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// 从 package.json 读取版本号
function getPackageVersion() {
  const packagePath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  let version = args.find((arg, i) => args[i - 1] === '--version');
  const notesFile = args.find((arg, i) => args[i - 1] === '--notes');
  const notesText = args.find((arg, i) => args[i - 1] === '--release-notes');
  const outputDir = args.find((arg, i) => args[i - 1] === '--output');

  // 如果没有提供 --version，从 package.json 读取
  if (!version) {
    version = getPackageVersion();
    console.log(`📦 Using version from package.json: ${version}`);
  }

  return { version, notesFile, notesText, outputDir };
}

// 计算文件的 SHA512 哈希 (base64 编码)
function calculateSHA512(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha512');
  hash.update(fileBuffer);
  return hash.digest('base64');
}

// 从 CHANGELOG.md 提取指定版本的更新内容
function extractVersionNotes(content, version) {
  // 匹配版本标题，支持 ## [1.0.20] 或 ## 1.0.20 或 # v1.0.20 等格式
  const versionPattern = new RegExp(`##?\\s*\\[?v?${version.replace(/\./g, '\\.')}\\]?`, 'i');
  const lines = content.split('\n');

  let startIndex = -1;
  let endIndex = lines.length;

  // 找到版本标题所在行
  for (let i = 0; i < lines.length; i++) {
    if (versionPattern.test(lines[i])) {
      startIndex = i + 1; // 从下一行开始
      break;
    }
  }

  if (startIndex === -1) {
    return null; // 未找到该版本
  }

  // 找到下一个版本标题（作为结束位置）
  for (let i = startIndex; i < lines.length; i++) {
    if (/^##?\s+\[/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  // 提取版本内容并清理
  const versionLines = lines.slice(startIndex, endIndex);
  const cleanedLines = versionLines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('###')); // 移除空行和三级标题

  return cleanedLines.join('\n');
}

// 获取 release notes（优先级：命令行参数 > 文件 > CHANGELOG.md > 默认值）
function getReleaseNotes(version, notesFile, notesText) {
  // 1. 优先使用命令行直接传入的文本
  if (notesText) {
    return notesText.split('\\n'); // 支持 \n 转义
  }

  // 2. 尝试从指定文件读取
  if (notesFile && fs.existsSync(notesFile)) {
    const content = fs.readFileSync(notesFile, 'utf-8');
    const extracted = extractVersionNotes(content, version);
    if (extracted) {
      return extracted;
    }
  }

  // 3. 尝试从默认 CHANGELOG.md 读取
  const changelogPaths = [
    path.join(rootDir, 'CHANGELOG.md'),
    path.join(rootDir, 'docs', 'CHANGELOG.md'),
    path.join(rootDir, 'RELEASE_NOTES.md'),
  ];

  for (const changelogPath of changelogPaths) {
    if (fs.existsSync(changelogPath)) {
      const content = fs.readFileSync(changelogPath, 'utf-8');
      const extracted = extractVersionNotes(content, version);
      if (extracted) {
        console.log(`✓ Loaded release notes from ${path.relative(rootDir, changelogPath)}`);
        return extracted;
      }
    }
  }

  // 4. 使用默认值
  console.warn('⚠ No release notes found, using default values');
  return [
    '- 更新内容请查看发布说明',
    '- 下载后运行安装包即可完成更新'
  ];
}

// 生成 YAML 内容
function generateYAML(data) {
  const lines = [];

  lines.push(`version: ${data.version}`);
  lines.push(`releaseDate: '${data.releaseDate}'`);

  if (data.files && data.files.length > 0) {
    lines.push('files:');
    for (const file of data.files) {
      lines.push(`  - url: ${file.url}`);
      lines.push(`    sha512: ${file.sha512}`);
      lines.push(`    size: ${file.size}`);
    }
  }

  lines.push(`path: ${data.path}`);
  lines.push(`sha512: ${data.sha512}`);

  if (data.releaseNotes) {
    lines.push('releaseNotes: |-');
    const notes = Array.isArray(data.releaseNotes)
      ? data.releaseNotes.join('\n')
      : data.releaseNotes;
    for (const line of notes.split('\n')) {
      lines.push(`  ${line}`);
    }
  }

  return lines.join('\n') + '\n';
}

// 主函数
async function main() {
  const { version, notesFile, notesText, outputDir } = parseArgs();
  const outDir = outputDir ? path.resolve(outputDir) : path.join(rootDir, 'out');

  // 检查输出目录
  if (!fs.existsSync(outDir)) {
    console.error(`Error: Output directory not found: ${outDir}`);
    console.error('Please run "npm run make" first to build the application.');
    process.exit(1);
  }

  const releaseDate = new Date().toISOString();
  const releaseNotes = getReleaseNotes(version, notesFile, notesText);

  // 生成 macOS 清单
  const macFiles = [
    { pattern: `OpenCode Go-${version}-arm64.dmg`, arch: 'arm64' },
    { pattern: `OpenCode Go-${version}-arm64-mac.zip`, arch: 'arm64' },
  ];

  for (const fileInfo of macFiles) {
    const filePath = path.join(outDir, fileInfo.pattern);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sha512 = calculateSHA512(filePath);
      const fileName = path.basename(filePath);

      const manifest = {
        version,
        releaseDate,
        files: [{
          url: fileName,
          sha512,
          size: stats.size
        }],
        path: fileName,
        sha512,
        releaseNotes
      };

      const yamlContent = generateYAML(manifest);
      const outputFile = path.join(outDir, 'latest-mac.yml');
      fs.writeFileSync(outputFile, yamlContent);

      console.log(`✓ Generated ${outputFile}`);
      console.log(`  Version: ${version}`);
      console.log(`  File: ${fileName}`);
      console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      break; // 只需要第一个找到的文件
    }
  }

  // 生成 Windows 清单
  const winPattern = `OpenCode Go Setup ${version}.exe`;
  const winPath = path.join(outDir, winPattern);

  if (fs.existsSync(winPath)) {
    const stats = fs.statSync(winPath);
    const sha512 = calculateSHA512(winPath);
    const fileName = path.basename(winPath);

    const manifest = {
      version,
      releaseDate,
      files: [{
        url: fileName,
        sha512,
        size: stats.size
      }],
      path: fileName,
      sha512,
      releaseNotes
    };

    const yamlContent = generateYAML(manifest);
    const outputFile = path.join(outDir, 'latest.yml');
    fs.writeFileSync(outputFile, yamlContent);

    console.log(`✓ Generated ${outputFile}`);
    console.log(`  Version: ${version}`);
    console.log(`  File: ${fileName}`);
    console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n📝 Next steps:');
  console.log('1. Review the generated YAML files in the out/ directory');
  console.log('2. Upload the following files to your update server:');
  console.log('   - out/latest-mac.yml → https://your-update-server.example.com/latest-mac.yml');
  console.log('   - out/latest.yml → https://your-update-server.example.com/latest.yml');
  console.log('   - out/*.dmg or out/*.exe → https://your-update-server.example.com/download/<filename>');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
