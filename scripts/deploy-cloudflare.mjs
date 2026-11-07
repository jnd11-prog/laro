// Points the built Worker config at YOUR Cloudflare D1 database and R2 bucket, then deploys.
// The build writes placeholder IDs (it was generated for a managed host), so this fills them in.
//
//   LARO_D1_ID=<database_id from `wrangler d1 create laro`> \
//   LARO_R2_BUCKET=laro-audio \
//   LARO_APPLY_SCHEMA=1 \            (first deploy only)
//   node scripts/deploy-cloudflare.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const file = new URL("../dist/server/wrangler.json", import.meta.url);
const { LARO_D1_ID, LARO_R2_BUCKET = "laro-audio", LARO_WORKER_NAME = "laro-fc" } = process.env;
if (!LARO_D1_ID) {
  console.error("Set LARO_D1_ID to the database_id printed by `npx wrangler d1 create laro`.");
  process.exit(1);
}
let config;
try {
  config = JSON.parse(readFileSync(file, "utf8"));
} catch {
  console.error("dist/server/wrangler.json not found. Run `pnpm build` first.");
  process.exit(1);
}
config.name = LARO_WORKER_NAME;
for (const db of config.d1_databases ?? []) {
  db.database_id = LARO_D1_ID;
  db.database_name = "laro";
}
for (const bucket of config.r2_buckets ?? []) bucket.bucket_name = LARO_R2_BUCKET;
writeFileSync(file, JSON.stringify(config, null, 2));
console.log(`Configured ${config.name}: D1 ${LARO_D1_ID}, R2 ${LARO_R2_BUCKET}`);

const run = (args) => {
  const r = spawnSync("npx", args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
// First deploy only: create the tables (set LARO_APPLY_SCHEMA=1). Re-running would fail on existing tables.
if (process.env.LARO_APPLY_SCHEMA === "1") {
  const { readdirSync } = await import("node:fs");
  for (const sql of readdirSync(new URL("../drizzle/", import.meta.url)).filter((f) => f.endsWith(".sql")).sort()) {
    run(["wrangler", "d1", "execute", "DB", "--remote", "--config", "dist/server/wrangler.json", "--file", `drizzle/${sql}`]);
  }
}
run(["wrangler", "deploy", "--config", "dist/server/wrangler.json"]);
