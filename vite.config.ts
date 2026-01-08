import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["sip.js"],
    esbuildOptions: {
      target: "es2020",
    },
  },
  server: {
    host: "0.0.0.0", // Allow access from network
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 3040,
    allowedHosts: [
      "qrcard.gozcu.tech",
      "localhost",
      "127.0.0.1",
      "46.101.111.170",
      "178.157.15.26",
      "72.62.44.200",
    ],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild", // Use esbuild instead of terser (faster and no extra dependency)
  },
});
