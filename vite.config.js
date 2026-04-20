import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ["react-icons"],
  },
  build: {
    outDir: 'dist', // Ensure the output directory is set to 'dist'
    ssrManifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-dom') || id.includes('react-router') || id.includes('react-helmet-async') || id.includes('react-slick') || id.includes('slick-carousel')) {
            return 'react-core';
          }

          if (id.includes('framer-motion')) {
            return 'motion';
          }

          if (id.includes('react-icons') || id.includes('@fortawesome')) {
            return 'icons';
          }

          if (id.includes('react-markdown') || id.includes('remark-gfm')) {
            return 'markdown';
          }

          if (id.includes('axios') || id.includes('@google/genai')) {
            return 'data-services';
          }

          return 'vendor';
        },
      },
    },
  },
});
