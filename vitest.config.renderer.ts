import { defineConfig } from 'vitest/config';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: 'default',
        ref: true,
        titleProp: true,
      },
      include: '**/*.svg',
    }),
  ],
  test: {
    name: 'renderer',
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.renderer.ts'],
    include: ['src/apps/renderer/**/*.test.{ts,tsx}',/*'src/apps/backups/index.test.ts',*/],
    watch: false,
    exclude: [
      '**/node_modules/**',
      '**/release/**',
    ],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/release/**',
        '**/tests/**',
        '**/*.test.{ts,tsx}',
        '**/__mocks__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock CSS modules
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    },
  },
});
