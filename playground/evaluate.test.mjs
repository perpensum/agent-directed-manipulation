import assert from "node:assert/strict";
import test from "node:test";

import { CASES } from "./cases.mjs";
import { OUTCOME_STATES, evaluatePurchase } from "./evaluate.mjs";

const expected = new Map([
  ["provider-success-unusable", "delivered_unusable"],
  ["usable", "usable"],
  ["paid-no-delivery", "paid_without_delivery"],
  ["retryable", "delivery_pending_recoverable"],
  ["insufficient", "insufficient_evidence"],
]);

test("the five synthetic cases reproduce all five outcome states", () => {
  const observed = new Set();
  for (const item of CASES) {
    const result = evaluatePurchase(item.input);
    assert.equal(result.state, expected.get(item.id));
    observed.add(result.state);
  }
  assert.deepEqual([...observed].sort(), [...OUTCOME_STATES].sort());
});

test("provider success does not override buyer-side unusability", () => {
  const item = CASES.find((candidate) => candidate.id === "provider-success-unusable");
  assert.equal(item.input.provider_status, "succeeded");
  assert.equal(evaluatePurchase(item.input).state, "delivered_unusable");
});

test("missing pre-purchase criteria produces insufficient evidence", () => {
  const item = CASES.find((candidate) => candidate.id === "usable");
  const result = evaluatePurchase({
    ...item.input,
    requirements_frozen_before_purchase: false,
  });
  assert.equal(result.state, "insufficient_evidence");
  assert.ok(result.evidence_gaps.includes("Pre-purchase acceptance criteria"));
});

test("a failed outcome never becomes a fraud conclusion", () => {
  for (const item of CASES) {
    assert.equal(evaluatePurchase(item.input).fraud_conclusion, "Not determined");
  }
});
