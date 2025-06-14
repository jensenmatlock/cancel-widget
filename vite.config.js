// vite.config.js
export default {
  base: '/cancel-widget/',
  build: {
    outDir: '.',
    emptyOutDir: false, // So it doesn't delete your src/ etc.
    rollupOptions: {
      input: './src/main.js',
      output: {
        entryFileNames: `widget.js`, // Clean output name
      }
    }
  }
};

