import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    ssr: 'server.ts',
    outDir: 'dist',
    target: 'node18',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'server.js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
