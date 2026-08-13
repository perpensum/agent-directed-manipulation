import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { runSandboxPurchase } from "./client.mjs";

test("browser client sends only a selected synthetic scenario", async () => {
  const calls = [];
  const result = await runSandboxPurchase({
    scenario: "provider_succeeded_unusable",
    endpoint: "https://api.test/v1/sandbox",
    async fetch(url, options) {
      calls.push({ url, options });
      return new Response(JSON.stringify({ verification: { state: "delivered_unusable" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(result.verification.state, "delivered_unusable");
  assert.equal(calls[0].url, "https://api.test/v1/sandbox");
  assert.deepEqual(JSON.parse(calls[0].options.body), { scenario: "provider_succeeded_unusable" });
  assert.equal(calls[0].options.headers.authorization, undefined);
});

test("archived developer demos are separated from the current CEN product", async () => {
  const quickstart = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const quickstartJa = await readFile(new URL("./ja.html", import.meta.url), "utf8");
  const docs = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const docsJa = await readFile(new URL("../docs/ja.html", import.meta.url), "utf8");
  const browserApp = await readFile(new URL("./app.js", import.meta.url), "utf8");
  const script = await readFile(new URL("./quickstart.mjs", import.meta.url), "utf8");
  assert.match(quickstart, /The same flow in four commands/);
  assert.match(quickstart, /Choose what the synthetic seller delivers/);
  assert.match(quickstart, /Content and workflow verification/);
  assert.match(quickstart, /wrong_content_workflow_accepted/);
  assert.equal((quickstart.match(/class="timeline-detail-toggle"/g) ?? []).length, 5);
  assert.match(quickstart, /id="timeline-detail-mandate"/);
  assert.doesNotMatch(quickstart, /id="trace-grid"/);
  assert.match(quickstart, /href="\/quickstart\/ja"/);
  assert.match(quickstart, /Archived research demo/);
  assert.match(quickstart, /not the current Perpensum product contract or current MCP integration/);
  assert.match(quickstart, /CEN and the Decision Engine/);
  assert.match(quickstart, /https:\/\/api\.perpensum\.org\//);
  assert.doesNotMatch(quickstart, /app\.perpensum\.org|@perpensum\/mcp|@perpensum\/sdk/);
  assert.match(quickstartJa, /同じ流れを4コマンドで試す/);
  assert.match(quickstartJa, /合成売り手が何を納品するか選ぶ/);
  assert.match(quickstartJa, /内容品質と後続利用の検証/);
  assert.match(quickstartJa, /wrong_content_workflow_accepted/);
  assert.equal((quickstartJa.match(/class="timeline-detail-toggle"/g) ?? []).length, 5);
  assert.match(quickstartJa, /詳細を見る/);
  assert.doesNotMatch(quickstartJa, /id="trace-grid"/);
  assert.match(quickstartJa, /href="\/quickstart"/);
  assert.match(quickstartJa, /アーカイブ済み研究demo/);
  assert.match(quickstartJa, /現行Perpensumの製品契約やMCP接続ではありません/);
  assert.match(quickstartJa, /CENとDecision Engine/);
  assert.doesNotMatch(quickstartJa, /app\.perpensum\.org|@perpensum\/mcp|@perpensum\/sdk/);
  assert.match(docs, /three-call MCP loop/);
  assert.match(docs, /href="\/docs\/ja"/);
  assert.match(docs, /structured invoice extraction through Replicate/);
  assert.match(docs, /not plug-and-play today/);
  assert.match(docsJa, /3-call MCP loop/);
  assert.match(docsJa, /Replicate経由の構造化請求書抽出/);
  assert.match(docsJa, /そのまますぐ接続できるという意味ではありません/);
  assert.match(docsJa, /href="\/docs"/);
  assert.match(browserApp, /result\.mandate/);
  assert.match(browserApp, /result\.verification\.constraint_checks/);
  assert.match(browserApp, /result\.evidence_record/);
  assert.match(browserApp, /function closeAllDetails\(\)/);
  assert.match(browserApp, /aria-expanded/);
  assert.match(browserApp, /timeline-detail-toggle/);
  assert.match(browserApp, /content_validity/);
  assert.match(browserApp, /workflow_utility/);
  assert.match(script, /provider_succeeded_unusable/);
  assert.doesNotMatch(`${quickstart}${quickstartJa}${docs}${docsJa}${browserApp}${script}`, /api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{12,}/i);
});

test("Japanese developer pages publish reciprocal language metadata", async () => {
  const quickstart = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const quickstartJa = await readFile(new URL("./ja.html", import.meta.url), "utf8");
  const docs = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const docsJa = await readFile(new URL("../docs/ja.html", import.meta.url), "utf8");
  for (const page of [quickstart, quickstartJa]) {
    assert.match(page, /hreflang="en" href="https:\/\/perpensum\.org\/quickstart"/);
    assert.match(page, /hreflang="ja" href="https:\/\/perpensum\.org\/quickstart\/ja"/);
  }
  for (const page of [docs, docsJa]) {
    assert.match(page, /hreflang="en" href="https:\/\/perpensum\.org\/docs"/);
    assert.match(page, /hreflang="ja" href="https:\/\/perpensum\.org\/docs\/ja"/);
  }
});
