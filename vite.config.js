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
      output: {
        manualChunks(id) {
          if (!id) {
            return undefined;
          }

          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router") || id.includes("\\react\\") || id.includes("/react/")) {
              return "react-core";
            }

            if (
              id.includes("framer-motion") ||
              id.includes("react-slick") ||
              id.includes("slick-carousel") ||
              id.includes("aos")
            ) {
              return "experience-vendor";
            }

            if (
              id.includes("react-icons") ||
              id.includes("@fortawesome")
            ) {
              return "icon-vendor";
            }

            return "vendor";
          }

          if (
            id.includes("/src/pages/PlatformAdminDashboard") ||
            id.includes("/src/pages/AdminDashboard") ||
            id.includes("/src/pages/AdminLogin") ||
            id.includes("/src/pages/PlatformAdminLogin") ||
            id.includes("/src/components/Admin/") ||
            id.includes("/src/context/PlatformAdminAuthContext") ||
            id.includes("/src/context/AdminAuthContext")
          ) {
            return "admin-studio";
          }

          if (
            id.includes("/src/pageBuilder/") ||
            id.includes("/src/sections/")
          ) {
            return "page-builder";
          }

          if (
            id.includes("/src/components/Chat/") ||
            id.includes("/src/components/WhatsApp/") ||
            id.includes("/src/components/OrderPopup/")
          ) {
            return "engagement-widgets";
          }

          return undefined;
        },
      },
    },
  },
});
