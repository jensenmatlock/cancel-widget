import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'widgets', // root is widgets folder (where dev.html lives)
  base: './', // use relative paths for dev/prod
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'widgets'),
    },
    extensions: ['.js'],
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true, // helps hot reload on some systems
    },
  },
  build: {
    rollupOptions: {
      input: './widgets/dev.html',
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
