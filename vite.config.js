// vite.config.js
export default {
  base: '/cancel-widget/',
  build: {
    outDir: 'site',
    emptyOutDir: false, // So it doesn't delete your src/ etc.
    rollupOptions: {
      input: 'widget/main.js',
      output: {
        entryFileNames: `widget.js`, // Clean output name
      }
    }
  }
};

