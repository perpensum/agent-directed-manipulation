import { runSandboxPurchase } from "./client.mjs";

const form = document.querySelector("#sandbox-form");
const button = document.querySelector("#run-sandbox");
const message = document.querySelector("#run-message");
const timeline = document.querySelector("#timeline");
const verdict = document.querySelector("#verdict");
const verdictState = document.querySelector("#verdict-state");
const verdictDetail = document.querySelector("#verdict-detail");
const nextAction = document.querySelector("#next-action");
const copyButton = document.querySelector("#copy-commands");
const commands = document.querySelector("#commands");

function tone(state) {
  if (state === "usable") return "pass";
  if (state === "delivered_unusable") return "fail";
  return "wait";
}

function render(result) {
  const rows = timeline.querySelectorAll("li");
  result.timeline.forEach((item, index) => {
    const row = rows[index];
    if (!row) return;
    row.dataset.state = "complete";
    row.querySelector("strong").textContent = item.label;
    row.querySelector("span").textContent = `${item.status} — ${item.detail}`;
  });
  verdict.dataset.tone = tone(result.verification.state);
  verdictState.textContent = result.verification.state;
  verdictDetail.textContent = result.verification.observation;
  nextAction.textContent = `Next purchase action: ${result.verification.next_purchase_action}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  message.textContent = "Running the purchase through the live Perpensum sandbox…";
  try {
    const data = new FormData(form);
    const result = await runSandboxPurchase({ scenario: data.get("scenario") });
    render(result);
    message.textContent = "Complete. No money moved and nothing was retained.";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(commands.textContent.trim());
    copyButton.textContent = "Copied";
    setTimeout(() => { copyButton.textContent = "Copy"; }, 1_500);
  } catch {
    copyButton.textContent = "Select and copy";
  }
});
