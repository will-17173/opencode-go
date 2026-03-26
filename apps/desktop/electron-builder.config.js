const fs = require('fs');
const path = require('path');

const allBinaries = [
  { from: 'node_modules/opencode-darwin-arm64/bin/opencode', to: 'opencode-darwin-arm64/bin/opencode' },
  { from: 'node_modules/opencode-darwin-x64/bin/opencode', to: 'opencode-darwin-x64/bin/opencode' },
  { from: 'node_modules/opencode-linux-x64/bin/opencode', to: 'opencode-linux-x64/bin/opencode' },
  { from: 'node_modules/opencode-linux-arm64/bin/opencode', to: 'opencode-linux-arm64/bin/opencode' },
  { from: 'node_modules/opencode-windows-x64/bin/opencode.exe', to: 'opencode-windows-x64/bin/opencode.exe' },
];

const extraResources = allBinaries.filter((b) => fs.existsSync(path.join(__dirname, b.from)));

module.exports = {
  appId: 'ai.opencode.go',
  productName: 'OpenCode Go',

  // Windows 代码签名配置（通过环境变量）
  cscLink: process.env.CSC_LINK,
  cscKeyPassword: process.env.CSC_KEY_PASSWORD,

  directories: {
    buildResources: 'build',
    output: 'out',
  },
  files: [
    'dist/**/*',
    '!dist/mac*/**',
    '!dist/win*/**',
    '!dist/linux*/**',
    '!dist/*.dmg',
    '!dist/*.exe',
    '!dist/*.blockmap',
    '!dist/builder-*.yml',
    '!node_modules/opencode-*/**',
    'package.json',
  ],
  extraResources,

  publish: {
    provider: 'generic',
    url: process.env.UPDATE_SERVER_URL || 'https://opencodego.ai/updates',
    channel: 'latest',
  },

  mac: {
    target: [
      { target: 'dmg', arch: ['arm64'] },
      // macOS 支持检查更新（读取 latest-mac.yml），但用户需手动下载 DMG 安装
      // 不生成 zip 文件，不需要签名和公证
    ],
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.inherit.plist',
    entitlementsInherit: 'build/entitlements.mac.inherit.plist',
    identity: null,
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    signtoolOptions: {
      signingHashAlgorithms: ['sha256'],
      rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    },
    signAndEditExecutable: true,
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  protocols: [
    {
      name: 'OpenCode Go Protocol',
      schemes: ['opencodego'],
    },
  ],
};
