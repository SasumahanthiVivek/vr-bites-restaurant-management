import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const apiProxy = (target) => ({
  "/api": {
    target,
    changeOrigin: true,
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

  return {
    plugins: [react()],
    server: {
      proxy: apiProxy(apiTarget),
    },
    preview: {
      proxy: apiProxy(apiTarget),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("@clerk")) return "clerk";
            if (id.includes("@stripe") || id.includes("stripe-js")) return "stripe";
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules\\react\\") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            return undefined;
          },
        },
      },
    },
  };
});
