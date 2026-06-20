#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "tsc", "-p", "apps/adou-laya/tsconfig.json", "--noEmit"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

process.exit(result.status ?? 1);
