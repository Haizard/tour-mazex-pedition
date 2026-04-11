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
  },
});
