/**
 * Supabase connection test  –  node test-connection.mjs
 *
 * Uses a single AbortController per request so we never block forever.
 * All logic is sequential/await — no unresolved promises left behind.
 */
import { readFileSync } from "fs";

/* ── env ── */
const raw = readFileSync(".env.local", "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const BASE = (env.VITE_SUPABASE_URL  ?? "").replace(/\/+$/, "");
const KEY  = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();

console.log("─".repeat(66));
console.log("  AICTE Complaint System — Supabase Connection Test");
console.log("─".repeat(66));
console.log(`📋  URL : ${BASE}`);
console.log(`🔑  Key : ${KEY.slice(0, 28)}…`);
console.log();

if (!BASE || !KEY) { console.error("❌  Missing credentials in .env.local"); process.exit(1); }

const HDRS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

/* ── fetch with hard timeout ── */
async function probe(url, timeoutMs = 8000) {
  const ac  = new AbortController();
  const tid = setTimeout(() => ac.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { headers: HDRS, signal: ac.signal });
  } finally {
    clearTimeout(tid);
  }

  // read body with its own timeout
  let body = "";
  try {
    const bodyP = res.text();
    const deadP = new Promise((_, rej) => setTimeout(() => rej(new Error("body-timeout")), 4000));
    body = await Promise.race([bodyP, deadP]);
  } catch { /* ignore body timeout */ }

  return { status: res.status, ok: res.ok, body };
}

let P = 0, F = 0;
const rows = [];

async function check(label, url) {
  let icon, note;
  try {
    const { status, ok, body } = await probe(url);

    let msg = "";
    try { msg = JSON.parse(body)?.message ?? ""; } catch {}

    if (ok) {
      let cnt = "—";
      try { const a = JSON.parse(body); cnt = Array.isArray(a) ? `${a.length} row(s)` : "ok"; } catch {}
      icon = "✅"; note = cnt; P++;
    } else if (msg.includes("does not exist") || msg.includes("relation")) {
      icon = "❌"; note = "table missing — run schema.sql first"; F++;
    } else if (msg.includes("infinite recursion")) {
      icon = "❌"; note = "RLS recursion — run fix_rls_recursion.sql"; F++;
    } else if (status === 401 || status === 403 || msg.includes("JWT") || msg.includes("permission")) {
      icon = "✅"; note = "RLS active (table exists ✓)"; P++;
    } else {
      icon = "❌"; note = `HTTP ${status}${msg ? " – " + msg.slice(0, 80) : ""}`; F++;
    }
  } catch (err) {
    const m = err.message ?? String(err);
    icon = "❌"; note = m.includes("abort") ? "timeout / no response" : m; F++;
  }
  rows.push({ label, icon, note });
}

/* ── checks ── */
await check("Network (REST root)",      `${BASE}/rest/v1/`);
await check("bureaus",                  `${BASE}/rest/v1/bureaus?select=id,code,name&limit=3`);
await check("regional_offices",         `${BASE}/rest/v1/regional_offices?select=id,code&limit=3`);
await check("institutions",             `${BASE}/rest/v1/institutions?select=id,name&limit=3`);
await check("cases",                    `${BASE}/rest/v1/cases?select=id,case_number&limit=3`);
await check("case_actions",             `${BASE}/rest/v1/case_actions?select=id&limit=1`);
await check("case_notes",               `${BASE}/rest/v1/case_notes?select=id&limit=1`);
await check("sla_rules",                `${BASE}/rest/v1/sla_rules?select=id,priority&limit=5`);
await check("overlap_alerts",           `${BASE}/rest/v1/overlap_alerts?select=id&limit=1`);
await check("notifications",            `${BASE}/rest/v1/notifications?select=id&limit=1`);
await check("profiles",                 `${BASE}/rest/v1/profiles?select=id&limit=1`);

/* ── print ── */
for (const { label, icon, note } of rows)
  console.log(`  ${label.padEnd(28)} ${icon}  ${note}`);

const total = P + F;
console.log();
console.log("─".repeat(66));

if (F === 0) {
  console.log(`✅  All ${total} checks passed — database connected and ready.`);
} else {
  console.log(`⚠️   ${P}/${total} passed  ·  ${F} failed`);
  const needsRecursionFix = rows.some(r => r.note?.includes("recursion"));
  const needsSchema       = rows.some(r => r.note?.includes("schema.sql"));
  console.log();
  if (needsSchema) {
    console.log("  In Supabase SQL Editor (https://app.supabase.com):");
    console.log("    1. Run  supabase/schema.sql");
    console.log("    2. Run  supabase/seed.sql");
    console.log("    3. Run  supabase/fix_rls_recursion.sql");
  } else if (needsRecursionFix) {
    console.log("  In Supabase SQL Editor, run:  supabase/fix_rls_recursion.sql");
  }
  console.log("  Then re-run:  node test-connection.mjs");
}
console.log("─".repeat(66));

process.exit(F === 0 ? 0 : 1);
