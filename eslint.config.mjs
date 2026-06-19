import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".layaair-cache/**",
    ".laya-build/**",
    "public/adou-laya/**",
    "apps/adou-laya/bin/**",
    "apps/adou-laya/engine/**",
    "apps/adou-laya/library/**",
    "apps/adou-laya/local/**",
    "apps/adou-laya/release/**",
    "apps/adou-laya/temp/**",
  ]),
]);

export default eslintConfig;
