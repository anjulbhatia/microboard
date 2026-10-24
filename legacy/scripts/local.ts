/**
 * One-setting dev stack: Convex dev (sync + watch) + Vite, with a
 * live-function preflight before Vite starts.
 *
 * Usage: bun run local
 * Ctrl+C stops both. Reads deployment from .env.local (CONVEX_DEPLOYMENT).
 */
import { spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LOG = join(ROOT, "scripts", "local.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    appendFileSync(LOG, line);
  } catch {
    // ignore
  }
}

function banner(msg: string) {
  console.log(`\n[local] ${msg}`);
}

function runOnce(cmd: string): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, { cwd: ROOT, shell: true });
    let out = "";
    p.stdout?.on("data", (d: Buffer) => (out += d.toString()));
    p.stderr?.on("data", (d: Buffer) => (out += d.toString()));
    p.on("close", (code) => resolve({ ok: code === 0, out }));
    p.on("error", (e) => resolve({ ok: false, out: String(e) }));
  });
}

async function backendLive(tries = 24): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    // Zero-arg ping — no quoting to mangle headless.
    const r = await runOnce(`npx convex run health:ping`);
    log(`poll ${i + 1}: ok=${r.ok} ${r.out.split("\n").filter(Boolean).slice(-2).join(" | ").slice(0, 160)}`);
    if (r.ok) return true;
    await Bun.sleep(5000);
  }
  return false;
}

async function main() {
  if (!existsSync(join(ROOT, "convex", "schema.ts"))) {
    console.error("[local] Run from the repo root.");
    process.exit(1);
  }
  const env = existsSync(join(ROOT, ".env.local")) ? readFileSync(join(ROOT, ".env.local"), "utf8") : "";
  const dep = env.split("\n").find((l) => l.startsWith("CONVEX_DEPLOYMENT=")) ?? "CONVEX_DEPLOYMENT=<missing>";
  banner(`Deployment: ${dep}`);

  const children: ChildProcess[] = [];
  const shutdown = () => {
    for (const c of children) {
      try {
        c.kill();
      } catch {
        // already gone
      }
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  banner("Starting convex dev (sync + watch)…");
  children.push(spawn("npx convex dev", { cwd: ROOT, shell: true, stdio: "inherit" }));

  banner("Waiting for live functions…");
  if (!(await backendLive())) {
    console.error("[local] Backend never answered. Convex output above — fix and retry.");
    shutdown();
  }
  banner("Functions live. Starting vite…");
  children.push(spawn("bun run dev", { cwd: ROOT, shell: true, stdio: "inherit" }));
  banner("Stack live: app http://localhost:5173 (Ctrl+C stops)");

  await new Promise(() => {});
}

main().catch((e) => {
  console.error("[local] Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
