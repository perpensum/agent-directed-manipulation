import { CASES } from "./cases.mjs";
import { evaluatePurchase } from "./evaluate.mjs";

const form = document.querySelector("#evidence-form");
const presetList = document.querySelector("#presets");
const resultBox = document.querySelector("#result");
const resultState = document.querySelector("#result-state");
const resultAction = document.querySelector("#result-action");
const resultReasons = document.querySelector("#result-reasons");
const evidenceGaps = document.querySelector("#evidence-gaps");
const caseSummary = document.querySelector("#case-summary");

function readInput() {
  return {
    provider_status: form.elements.provider_status.value,
    payment_status: form.elements.payment_status.value,
    delivery_status: form.elements.delivery_status.value,
    retry_entitlement: form.elements.retry_entitlement.value,
    buyer_usability: form.elements.buyer_usability.value,
    requirements_frozen_before_purchase: form.elements.requirements_frozen_before_purchase.checked,
  };
}

function setInput(input) {
  for (const [key, value] of Object.entries(input)) {
    if (key === "requirements_frozen_before_purchase") {
      form.elements[key].checked = value;
    } else {
      form.elements[key].value = value;
    }
  }
}

function render() {
  const outcome = evaluatePurchase(readInput());
  resultBox.dataset.tone = outcome.tone;
  resultState.textContent = outcome.label;
  resultAction.textContent = outcome.action;
  resultReasons.replaceChildren(...outcome.reasons.map((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    return item;
  }));

  const gaps = outcome.evidence_gaps.length
    ? outcome.evidence_gaps
    : ["None for this limited determination"];
  evidenceGaps.replaceChildren(...gaps.map((gap) => {
    const item = document.createElement("li");
    item.textContent = gap;
    return item;
  }));
}

function chooseCase(selectedCase, button) {
  setInput(selectedCase.input);
  caseSummary.textContent = selectedCase.summary;
  for (const item of presetList.querySelectorAll("button")) {
    item.setAttribute("aria-pressed", String(item === button));
  }
  render();
}

for (const [index, item] of CASES.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = item.name;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => chooseCase(item, button));
  presetList.append(button);
  if (index === 0) chooseCase(item, button);
}

form.addEventListener("input", () => {
  caseSummary.textContent = "Custom evidence combination.";
  for (const item of presetList.querySelectorAll("button")) {
    item.setAttribute("aria-pressed", "false");
  }
  render();
});
