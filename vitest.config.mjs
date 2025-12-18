import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup-silence-logs.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['tests/**', 'node_modules/**'],
    },
    testTimeout: 30000,
    server: {
      deps: {
        inline: ['nock'],
      },
    },
  },
});
