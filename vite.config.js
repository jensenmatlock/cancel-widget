// vite.config.js
export default {
  root: 'widget',
  base: '/',
  build: {
    outDir: '../site',
    emptyOutDir: false, // So it doesn't delete your src/ etc.
    rollupOptions: {
      input: 'widget/main.js',
      output: {
        entryFileNames: `widget.js`, // Clean output name
      },
    },
  },
};
