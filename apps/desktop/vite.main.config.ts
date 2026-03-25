import { defineConfig } from 'vite';
import path from 'node:path';

// 编译 Electron 主进程和预加载脚本
export default defineConfig({
  cacheDir: 'node_modules/.vite-main',
  build: {
    lib: {
      entry: {
        main: path.resolve(__dirname, 'src/main.ts'),
        preload: path.resolve(__dirname, 'src/preload.ts'),
      },
      formats: ['cjs'],
    },
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      external: [
        'electron',
        'node:path',
        'node:fs',
        'node:http',
        'node:child_process',
        'node:url',
        'path',
        'fs',
        'http',
        'child_process',
        'url',
        'crypto',
        'os',
        'stream',
        'events',
        'net',
        'tls',
        'zlib',
        'buffer',
        'util',
        'assert',
        'querystring',
        'string_decoder',
        /^node:/,
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
    target: 'node20',
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
