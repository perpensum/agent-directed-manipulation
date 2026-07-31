export const OUTCOME_STATES = Object.freeze([
  "usable",
  "delivered_unusable",
  "paid_without_delivery",
  "delivery_pending_recoverable",
  "insufficient_evidence",
]);

const STATE_DETAILS = Object.freeze({
  usable: {
    label: "Usable",
    action: "Allow this option to remain eligible",
    tone: "pass",
  },
  delivered_unusable: {
    label: "Delivered, but unusable",
    action: "Hold this option for the same purpose",
    tone: "fail",
  },
  paid_without_delivery: {
    label: "Paid without delivery",
    action: "Hold and investigate before buying again",
    tone: "fail",
  },
  delivery_pending_recoverable: {
    label: "Delivery pending, recoverable",
    action: "Retry the existing entitlement before repurchasing",
    tone: "wait",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    action: "Collect missing evidence; do not infer quality",
    tone: "unknown",
  },
});

function result(state, reasons, gaps = []) {
  return {
    state,
    ...STATE_DETAILS[state],
    reasons,
    evidence_gaps: gaps,
    fraud_conclusion: "Not determined",
  };
}

export function evaluatePurchase(input) {
  const evidenceGaps = [];

  if (input.payment_status === "unknown") evidenceGaps.push("Payment status");
  if (input.provider_status === "unknown") evidenceGaps.push("Provider-reported status");
  if (input.delivery_status === "unknown") evidenceGaps.push("Delivery evidence");
  if (input.buyer_usability === "unknown") evidenceGaps.push("Buyer-side usability observation");
  if (!input.requirements_frozen_before_purchase) evidenceGaps.push("Pre-purchase acceptance criteria");

  if (evidenceGaps.length > 0) {
    return result(
      "insufficient_evidence",
      ["The available record is not enough to compare the purchase promise with the buyer-side outcome."],
      evidenceGaps,
    );
  }

  if (input.payment_status === "paid" && input.delivery_status === "missing") {
    if (input.retry_entitlement === "available") {
      return result("delivery_pending_recoverable", [
        "Payment was observed, but delivery was not.",
        "The buyer still has a durable right to retry without paying again.",
      ]);
    }

    return result("paid_without_delivery", [
      "Payment was observed, but no delivery was observed.",
      "No durable retry entitlement was found.",
    ]);
  }

  if (input.delivery_status === "received" && input.buyer_usability === "no") {
    const reasons = [
      "A deliverable was received, but it did not meet the frozen acceptance criteria.",
    ];
    if (input.provider_status === "succeeded") {
      reasons.unshift("The provider reported success; that does not establish buyer-side usability.");
    }
    return result("delivered_unusable", reasons);
  }

  if (input.delivery_status === "received" && input.buyer_usability === "yes") {
    return result("usable", [
      "The deliverable was received and met the buyer's frozen acceptance criteria.",
      "This supports use for this purpose; it is not an absolute quality judgment.",
    ]);
  }

  return result(
    "insufficient_evidence",
    ["The observed combination does not support a purchase-quality conclusion."],
    ["A conclusive buyer-side outcome"],
  );
}
