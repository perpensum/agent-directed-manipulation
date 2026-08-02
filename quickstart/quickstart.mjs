const response = await fetch("https://api.perpensum.org/v1/sandbox", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ scenario: "provider_succeeded_unusable" }),
});

if (!response.ok) {
  throw new Error(`Perpensum sandbox failed with HTTP ${response.status}`);
}

const result = await response.json();
console.log(JSON.stringify({
  provider_status: result.delivery.provider_status,
  buyer_outcome: result.verification.state,
  next_purchase_action: result.verification.next_purchase_action,
  money_moved: result.sandbox.money_moved,
  persisted: result.sandbox.persisted,
}, null, 2));
