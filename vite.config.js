import { defineConfig } from 'vite';
import compression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig({
  root: 'widgets', // Dev server root (where dev.html lives)
  base: './', // Relative paths (works for local + hosting)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'widgets'),
    },
    extensions: ['.js'],
  },
  server: {
    port: 3000,
    watch: {
      usePolling: true, // Helps hot reload on Docker/VM setups
    },
  },
  plugins: [compression({ algorithm: 'brotliCompress' })],
  build: {
    outDir: '../dist', // Output at project root (not inside widgets)
    emptyOutDir: true, // Clean on each build
    assetsDir: 'assets', // JS/CSS/images live under /dist/assets/
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      // Keep dev.html for local dev, but build actual widget bundle
      input: {
        widget: './widgets/main.js', // Main JS entry (for production bundle)
        dev: './widgets/dev.html', // Dev page (optional, not for live use)
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
