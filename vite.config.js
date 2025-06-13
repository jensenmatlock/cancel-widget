// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.js',
      name: 'CancelWidget',
      fileName: () => 'widget.js',
      formats: ['iife'], // IIFE = self-executing for <script> tags
    },
    rollupOptions: {
      output: {
        globals: {
          // optionally declare globals for external libraries here
        },
      },
    },
  },
});
