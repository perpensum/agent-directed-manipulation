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

test("public pages distinguish working paths from unpublished package previews", async () => {
  const quickstart = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const docs = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("./quickstart.mjs", import.meta.url), "utf8");
  assert.match(quickstart, /The same flow in four commands/);
  assert.match(quickstart, /not on npm yet/);
  assert.match(docs, /not publicly installable packages yet/);
  assert.match(docs, /will not silently gain spending authority/);
  assert.match(script, /provider_succeeded_unusable/);
  assert.doesNotMatch(`${quickstart}${docs}${script}`, /api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{12,}/i);
});
