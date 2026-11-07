import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  test: {
    // jsdom rather than node: `downloadCsv` touches `document`, `Blob` and
    // `URL.createObjectURL`, and the decoder tests must not be the only ones
    // that can run.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Only application source counts. Test files and the mock data fixtures
      // would otherwise pad the denominator and hide real gaps.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/data/mockData.ts',
        'src/main.tsx',
        'src/types/**'
      ]
    }
  }
});
