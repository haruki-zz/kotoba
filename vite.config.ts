import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [
    react(),
    electron({
      main: {
        entry: "src/main/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/main",
            sourcemap: command === "serve",
            rollupOptions: {
              output: {
                entryFileNames: "index.mjs",
                format: "es"
              }
            }
          }
        }
      },
      preload: {
        input: {
          preload: path.join(__dirname, "src/preload/index.ts")
        },
        vite: {
          build: {
            outDir: "dist-electron/preload",
            sourcemap: command === "serve",
            rollupOptions: {
              output: {
                entryFileNames: "index.cjs",
                format: "cjs"
              }
            }
          }
        }
      }
    })
  ],
  build: {
    outDir: "dist/renderer"
  }
}));
