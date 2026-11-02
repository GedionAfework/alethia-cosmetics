/**
 * Runs Prisma with DIRECT_URL filled in when Vercel/Neon only set DATABASE_URL
 * (or DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING).
 *
 * If no DB URL is in the process env (local installs), Prisma still runs and
 * loads values from `.env` itself.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const env = { ...process.env };

if (!env.DATABASE_URL) {
  env.DATABASE_URL = env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || "";
}
if (!env.DIRECT_URL) {
  env.DIRECT_URL =
    env.DATABASE_URL_UNPOOLED ||
    env.POSTGRES_URL_NON_POOLING ||
    env.DATABASE_URL_UNPOOLED_PRISMA ||
    env.DATABASE_URL ||
    "";
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-prisma.cjs <prisma-args...>");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(result.status === null ? 1 : result.status);
