import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("./", import.meta.url);
const definition = JSON.parse(await readFile(new URL("definition.json", directory), "utf8"));
const html = await readFile(new URL("index.html", directory), "utf8");

test("the prose and machine-readable APQV definitions are identical", () => {
  const block = html.match(/<div class="definition">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const prose = block.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  assert.equal(prose, definition.definition);
});

test("APQV is published as a proposal rather than an adopted standard", () => {
  assert.equal(definition.status, "proposed-category");
  assert.match(html, /proposed category, not an adopted standard/i);
});

test("the minimal vocabulary contains five distinct bounded states", () => {
  const ids = definition.minimal_outcome_states.map((item) => item.id);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
  assert.ok(ids.includes("insufficient_evidence"));
});

test("the definition preserves authorization and quality as separate questions", () => {
  assert.notEqual(
    definition.authorization_boundary.authorization_question,
    definition.authorization_boundary.apqv_question,
  );
  assert.match(definition.authorization_boundary.apqv_question, /outcome/i);
});

test("failure is not represented as fraud by default", () => {
  assert.ok(definition.does_not_claim.some((claim) => /fraudulent intent/i.test(claim)));
  assert.match(html, /does not infer fraudulent intent from a mismatch or failure alone/i);
});
