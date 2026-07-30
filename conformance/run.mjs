#!/usr/bin/env node
// Defining Agent-Directed Manipulation v0.1 — conformance runner
//
// Checks whether your implementation reaches the same verdicts as this definition.
// No dependencies. Node 18 or later.
//
//   node run.mjs <path-to-your-implementation>
//
// Your implementation exports a function under one of default / scan / scanHtml,
// in either of these shapes:
//
//   (html: string)      => { findings: Array<{ severity: "info"|"warn"|"high" }> }
//   ({ html: string })  => { findings: Array<{ severity: "info"|"warn"|"high" }> }
//
// **Either is fine.** The argument shape is not part of the definition, so this runner
// tries both and keeps whichever works.
//
// Severity is compared using the **maximum** across findings. The ordering of findings
// is not part of the definition either.
//
// For what a verdict means, read `clause` and `why` in cases.json.
// **If a case disagrees, your implementation is not necessarily the one that is wrong.**
// A disagreement marks a place where the definition is ambiguous — please report it:
// https://github.com/perpensum/agent-directed-manipulation/issues

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node run.mjs <path-to-your-implementation>");
  process.exit(2);
}

const { cases, version } = JSON.parse(readFileSync(new URL("./cases.json", import.meta.url), "utf-8"));
const mod = await import(pathToFileURL(target).href);
const scan = mod.default ?? mod.scan ?? mod.scanHtml;
if (typeof scan !== "function") {
  console.error("The implementation exports no function (expected one of: default, scan, scanHtml)");
  process.exit(2);
}

const RANK = { info: 0, warn: 1, high: 2 };

// Try both the string form and the { html } form, then stay with whichever works.
// The argument shape is not part of the definition, so it is absorbed here.
let calling = null;
async function callScan(html) {
  const forms = calling ? [calling] : ["string", "object"];
  let lastErr;
  for (const form of forms) {
    try {
      const r = await scan(form === "string" ? html : { html });
      calling = form;
      return r;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function summarize(r) {
  const findings = Array.isArray(r?.findings) ? r.findings : [];
  let severity = null;
  for (const f of findings) {
    if (!(f?.severity in RANK)) continue;
    if (severity === null || RANK[f.severity] > RANK[severity]) severity = f.severity;
  }
  return { findings: findings.length, severity };
}

let agree = 0;
const disagreements = [];
for (const c of cases) {
  let got;
  try {
    got = summarize(await callScan(c.html));
  } catch (err) {
    got = { error: err?.message ?? String(err) };
  }
  const ok =
    !got.error &&
    got.findings === c.expected.findings &&
    (c.expected.severity === null || got.severity === c.expected.severity);
  if (ok) agree++;
  else disagreements.push({ id: c.id, clause: c.clause, why: c.why, expected: c.expected, got });
}

const how = calling === "object" ? "scan({ html })" : calling === "string" ? "scan(html)" : "not callable";
console.log(`Definition v${version} conformance: ${agree} / ${cases.length} agree (call form: ${how})\n`);
for (const d of disagreements) {
  console.log(`[disagreement] ${d.id}`);
  console.log(`  clause:   ${d.clause}`);
  console.log(`  why:      ${d.why}`);
  console.log(`  expected: findings=${d.expected.findings} severity=${d.expected.severity ?? "-"}`);
  console.log(`  got:      ${d.got.error ? "error: " + d.got.error : `findings=${d.got.findings} severity=${d.got.severity ?? "-"}`}\n`);
}
if (disagreements.length) {
  console.log("A disagreement is not proof that your implementation is wrong.");
  console.log("Please report it: https://github.com/perpensum/agent-directed-manipulation/issues");
}
process.exit(disagreements.length ? 1 : 0);
