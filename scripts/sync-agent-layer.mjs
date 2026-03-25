#!/usr/bin/env node
/**
 * Syncs @agent-layer/core and @agent-layer/hono from the main repo.
 * Clones, builds, and copies the dist + package.json into vendor/.
 *
 * Usage: node scripts/sync-agent-layer.mjs
 */
import { execSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "https://github.com/lightlayer-dev/agent-layer-ts.git";
const TMP = "/tmp/agent-layer-sync";
const VENDOR = join(import.meta.dirname, "..", "vendor");

console.log("🔄 Syncing agent-layer packages...\n");

// Clean + clone
rmSync(TMP, { recursive: true, force: true });
execSync(`git clone --depth 1 ${REPO} ${TMP}`, { stdio: "inherit" });

// Install + build
execSync("pnpm install && pnpm build", { cwd: TMP, stdio: "inherit" });

// Copy dist + package.json for core and hono
for (const pkg of ["core", "hono"]) {
  const src = join(TMP, "packages", pkg);
  const dest = join(VENDOR, `agent-layer-${pkg}`);

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  cpSync(join(src, "dist"), join(dest, "dist"), { recursive: true });
  cpSync(join(src, "package.json"), join(dest, "package.json"));

  // Fix workspace:* references for npm compatibility
  const pkgPath = join(dest, "package.json");
  const pkgContent = readFileSync(pkgPath, "utf8");
  writeFileSync(pkgPath, pkgContent.replace(/"workspace:\*"/g, '"*"'));

  console.log(`✅ Synced @agent-layer/${pkg}`);
}

// Cleanup
rmSync(TMP, { recursive: true, force: true });
console.log("\n🎉 Done! Run `npm install` to update node_modules.");
