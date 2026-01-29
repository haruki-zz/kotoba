import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);

const resolveFromRenderer = (pkg: string) =>
  require.resolve(pkg, { paths: [path.join(rootDir, "packages/renderer")] });

export default defineConfig({
  resolve: {
    alias: {
      "@kotoba/shared": path.resolve(rootDir, "packages/shared/src/index.ts"),
      zustand: resolveFromRenderer("zustand"),
    },
  },
});
