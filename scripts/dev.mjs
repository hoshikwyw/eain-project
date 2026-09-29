/**
 * Starts the Eain dev server(s).
 *
 *   node scripts/dev.mjs user    user site on http://localhost:5173
 *   node scripts/dev.mjs admin   admin site on http://localhost:5174
 *   node scripts/dev.mjs both    both at once
 *
 * Each site gets its own build folder so the two servers never share a
 * cache. Ctrl+C stops everything.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const sites = {
  user: { port: "5173", distDir: ".next" },
  admin: { port: "5174", distDir: ".next-admin" },
};

const arg = process.argv[2] ?? "user";
const modes = arg === "both" ? ["user", "admin"] : [arg];
for (const m of modes) {
  if (!sites[m]) {
    console.error(`Unknown mode "${m}". Use user, admin or both.`);
    process.exitCode = 1;
  }
}

const children = modes
  .filter((m) => sites[m])
  .map((mode) => {
    const { port, distDir } = sites[mode];
    const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
      stdio: "inherit",
      env: { ...process.env, EAIN_APP_MODE: mode, EAIN_DIST_DIR: distDir },
    });
    child.on("exit", (code) => {
      if (code && code !== 0) process.exitCode = code;
    });
    return child;
  });

const stop = () => children.forEach((c) => c.kill("SIGINT"));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
