import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";

const currentDir = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: currentDir
});

const config = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**"]
  },
  ...compat.extends("next/core-web-vitals")
];

export default config;
