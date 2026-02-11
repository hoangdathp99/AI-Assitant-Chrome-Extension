import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-manifest",
      closeBundle() {
        // Copy manifest and other static files to dist
        mkdirSync("dist/assets", { recursive: true });
        copyFileSync("manifest.json", "dist/manifest.json");

        // Copy SVG icons
        try {
          copyFileSync("assets/icon16.svg", "dist/assets/icon16.svg");
          copyFileSync("assets/icon48.svg", "dist/assets/icon48.svg");
          copyFileSync("assets/icon128.svg", "dist/assets/icon128.svg");
        } catch (e) {
          console.warn("Warning: Could not copy icon files");
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "content/content.tsx"),
        background: resolve(__dirname, "background/background.js"),
        popup: resolve(__dirname, "popup/popup.html"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep original directory structure
          if (chunkInfo.name === "content") return "content/content.js";
          if (chunkInfo.name === "background")
            return "background/background.js";
          if (chunkInfo.name === "popup") return "popup/popup.js";
          return "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          // CSS files
          if (assetInfo.name?.endsWith(".css")) {
            if (assetInfo.name.includes("content"))
              return "content/content.css";
            if (assetInfo.name.includes("popup")) return "popup/popup.css";
            return "[name].css";
          }
          return "assets/[name][extname]";
        },
      },
    },
    // Ensure compatibility with Chrome Extension
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
