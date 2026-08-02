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
const isJapanese = document.documentElement.lang === "ja";

const japanese = {
  timeline: {
    mandate: ["購買マンデート", "合成購買1件、総予算0米ドル。"],
    pre_purchase: ["購入前判断", "1回・費用0のSandboxマンデート内です。"],
    execution: ["合成提供者の実行", "外部の提供者は呼ばれず、お金も動いていません。"],
    verification: ["買い手側の成果検証", null],
    evidence: ["APQV証拠記録", "このセッションにだけ返され、公開Sandboxには保存されません。"],
  },
  statuses: {
    recorded: "記録済み",
    authorized: "承認",
    blocked: "停止",
    succeeded: "成功",
    unknown: "不明",
    not_executed: "未実行",
    usable: "利用可能",
    delivered_unusable: "納品済み・利用不能",
    insufficient_evidence: "証拠不足",
    created: "作成済み",
    not_created: "未作成",
  },
  outcomes: {
    usable: ["利用可能", "必須8項目と明細2件を、制限内にJSONとして読み取れました。"],
    delivered_unusable: ["納品済み・利用不能", "提供者は成功と報告しましたが、必須3項目と明細1件が不足していました。"],
    insufficient_evidence: ["証拠不足", "凍結した条件を検査できるだけの買い手側観測証拠が、提供者の応答に含まれていませんでした。"],
  },
  actions: {
    allow_with_current_evidence: "現在の証拠で許可",
    hold_same_offer_until_new_evidence: "新しい証拠が得られるまで同じ商品を保留",
    collect_evidence_before_repurchase: "再購入前に証拠を収集",
  },
};

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
    const localized = isJapanese && japanese.timeline[item.id];
    row.querySelector("strong").textContent = localized?.[0] ?? item.label;
    if (localized) {
      const detail = item.id === "verification"
        ? japanese.outcomes[item.status]?.[1] ?? item.detail
        : localized[1];
      row.querySelector("span").textContent = `${japanese.statuses[item.status] ?? item.status} — ${detail}`;
    } else {
      row.querySelector("span").textContent = `${item.status} — ${item.detail}`;
    }
  });
  const localizedOutcome = isJapanese && japanese.outcomes[result.verification.state];
  verdict.dataset.tone = tone(result.verification.state);
  verdictState.textContent = localizedOutcome?.[0] ?? result.verification.state;
  verdictDetail.textContent = localizedOutcome?.[1] ?? result.verification.observation;
  nextAction.textContent = isJapanese
    ? `次回の購買行動：${japanese.actions[result.verification.next_purchase_action] ?? result.verification.next_purchase_action}`
    : `Next purchase action: ${result.verification.next_purchase_action}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  message.textContent = isJapanese
    ? "Perpensumの公開Sandboxで購買を実行しています…"
    : "Running the purchase through the live Perpensum sandbox…";
  try {
    const data = new FormData(form);
    const result = await runSandboxPurchase({ scenario: data.get("scenario") });
    render(result);
    message.textContent = isJapanese
      ? "完了しました。お金は動かず、データも保存されていません。"
      : "Complete. No money moved and nothing was retained.";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(commands.textContent.trim());
    copyButton.textContent = isJapanese ? "コピー済み" : "Copied";
    setTimeout(() => { copyButton.textContent = isJapanese ? "コピー" : "Copy"; }, 1_500);
  } catch {
    copyButton.textContent = isJapanese ? "選択してコピー" : "Select and copy";
  }
});
