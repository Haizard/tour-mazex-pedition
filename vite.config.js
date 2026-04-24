import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  ssr: {
    // Required so react-icons ESM bundles are inlined during SSR build,
    // otherwise Node resolves the directory import which is not supported.
    noExternal: ["react-icons"],
  },
  build: {
    outDir: 'dist',
    ssrManifest: true,
    rollupOptions: {
      output: {},
    },
  },
});
