import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^server-only$/,
        replacement: fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
      },
      {
        find: /^@\/lib\/prisma$/,
        replacement: fileURLToPath(new URL("./tests/stubs/prisma.ts", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
