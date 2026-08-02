export const DEFAULT_SANDBOX_ENDPOINT = "https://api.perpensum.org/v1/sandbox";
export const SCENARIOS = Object.freeze([
  "usable",
  "provider_succeeded_unusable",
  "insufficient_evidence",
]);

export async function runSandboxPurchase(options = {}) {
  const scenario = options.scenario ?? "usable";
  if (!SCENARIOS.includes(scenario)) {
    throw new TypeError(`Unknown scenario: ${scenario}`);
  }
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");
  const response = await fetchImpl(options.endpoint ?? DEFAULT_SANDBOX_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message ?? "The Perpensum sandbox is unavailable.");
  return body;
}
