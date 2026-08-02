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
const traceEmpty = document.querySelector("#trace-empty");
const traceGrid = document.querySelector("#trace-grid");
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

const traceCopy = isJapanese ? {
  stages: {
    mandate: ["1", "購買マンデート", "会社が買い手AIへ与えた権限です。この範囲外なら、提供者を呼ぶ前に止めます。"],
    decision: ["2", "購入前判断", "買い手AIの購入依頼をマンデートと照合し、1回だけ使える実行券を発行しました。"],
    execution: ["3", "実行", "買い手側Gatewayが実行券を確認してから、テスト用の合成売り手を呼びました。"],
    verification: ["4", "成果検証", "購入前に固定した成功条件と、実際に観測した納品を項目ごとに比較しました。"],
    evidence: ["5", "証拠記録", "判断と観測結果を結び、次回の購買行動を返しました。公開Sandboxでは保存しません。"],
  },
  labels: {
    buyer: "買い手AI", purchases: "許可された回数", budget: "支出上限", protocols: "許可された経路",
    ticketLife: "実行券の有効時間", purpose: "購入目的", success: "成功条件", seller: "選んだ売り手",
    offer: "購入する商品", promise: "売り手の約束", price: "価格", countCheck: "回数チェック",
    budgetCheck: "予算チェック", routeCheck: "経路チェック", decision: "判断", reason: "判断理由",
    ticket: "実行券", provider: "提供者の処理結果", delivery: "観測した納品", external: "外部提供者の呼び出し",
    money: "お金の移動", requirement: "検証項目", outcome: "買い手側の成果", observation: "観測結果",
    record: "証拠記録", stored: "中央への保存", credentials: "提供者資格情報", fraud: "不正の結論",
    next: "次回の購買行動",
  },
  words: {
    yes: "あり", no: "なし", passed: "適合", failed: "不適合", authorized: "許可",
    singleUse: "1回限り", seconds: "秒", once: "1回", notDetermined: "判断していない",
    responseOnly: "このブラウザ応答内だけ", noPayload: "検査できる成果なし", unknown: "不明",
  },
  checks: {
    required_fields: "必須項目", line_items: "明細件数", machine_readable_json: "機械可読JSON",
    delivery_time_seconds: "納品時間",
  },
} : {
  stages: {
    mandate: ["1", "Purchase mandate", "The authority the organization delegated to the buyer agent. Anything outside it stops before a provider is called."],
    decision: ["2", "Pre-purchase decision", "The buyer agent's request was checked against the mandate and received a single-use execution ticket."],
    execution: ["3", "Execution", "The buyer-side Gateway verified the ticket, then called the synthetic test seller."],
    verification: ["4", "Outcome verification", "The frozen success condition was compared with the buyer-observed delivery requirement by requirement."],
    evidence: ["5", "Evidence record", "The decision and observation were linked to a next-purchase action. The public sandbox does not retain it."],
  },
  labels: {
    buyer: "Buyer agent", purchases: "Allowed purchases", budget: "Maximum spend", protocols: "Allowed route",
    ticketLife: "Execution ticket lifetime", purpose: "Purchase purpose", success: "Success condition", seller: "Selected seller",
    offer: "Selected offer", promise: "Seller promise", price: "Price", countCheck: "Purchase-count check",
    budgetCheck: "Budget check", routeCheck: "Route check", decision: "Decision", reason: "Decision reason",
    ticket: "Execution ticket", provider: "Provider-reported status", delivery: "Observed delivery", external: "External provider called",
    money: "Money moved", requirement: "Requirement check", outcome: "Buyer outcome", observation: "Observation",
    record: "Evidence record", stored: "Centrally retained", credentials: "Provider credentials", fraud: "Fraud conclusion",
    next: "Next purchase action",
  },
  words: {
    yes: "Yes", no: "No", passed: "Passed", failed: "Failed", authorized: "Authorized",
    singleUse: "Single use", seconds: "seconds", once: "1", notDetermined: "Not determined",
    responseOnly: "This browser response only", noPayload: "No inspectable payload", unknown: "Unknown",
  },
  checks: {
    required_fields: "Required fields", line_items: "Line items", machine_readable_json: "Machine-readable JSON",
    delivery_time_seconds: "Delivery time",
  },
};

function tone(state) {
  if (state === "usable") return "pass";
  if (state === "delivered_unusable") return "fail";
  return "wait";
}

function displayOutcome(state) {
  return isJapanese ? japanese.outcomes[state]?.[0] ?? state : state;
}

function displayAction(action) {
  return isJapanese ? japanese.actions[action] ?? action : action;
}

function displayDelivery(payload) {
  if (!payload) return traceCopy.words.noPayload;
  return isJapanese
    ? `${payload.format?.toUpperCase() ?? "形式不明"}：請求書${payload.invoice_fields ?? 0}項目、明細${payload.line_items ?? 0}件`
    : `${payload.format?.toUpperCase() ?? "Unknown format"}: ${payload.invoice_fields ?? 0} invoice fields, ${payload.line_items ?? 0} line items`;
}

function displayConstraint(check) {
  const verdictWord = check.passed ? traceCopy.words.passed : traceCopy.words.failed;
  if (check.id === "required_fields" || check.id === "line_items") {
    return `${verdictWord} — ${check.observed} / ${check.expected}`;
  }
  if (check.id === "delivery_time_seconds") {
    return `${verdictWord} — ${check.observed}${isJapanese ? "秒" : "s"} / ${isJapanese ? "上限" : "maximum"} ${check.maximum}${isJapanese ? "秒" : "s"}`;
  }
  return verdictWord;
}

function traceCard(id, stage, rows) {
  const article = document.createElement("article");
  article.className = "trace-card";
  article.id = `trace-${id}`;
  const header = document.createElement("div");
  header.className = "trace-card-head";
  const number = document.createElement("span");
  number.textContent = stage[0];
  const heading = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = stage[1];
  const summary = document.createElement("p");
  summary.textContent = stage[2];
  heading.append(title, summary);
  header.append(number, heading);
  const list = document.createElement("dl");
  rows.forEach((row) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const value = document.createElement("dd");
    term.textContent = row[0];
    value.textContent = row[1];
    if (row[2]) value.dataset.tone = row[2];
    wrapper.append(term, value);
    list.append(wrapper);
  });
  article.append(header, list);
  return article;
}

function renderTrace(result) {
  const mandate = result.mandate ?? {
    buyer_agent: result.purchase.buyer_agent,
    max_purchases: 1,
    max_total_amount: { amount: 0, currency: "USD" },
    allowed_protocols: ["tokenized_payment"],
    decision_ticket_ttl_seconds: 120,
  };
  const seller = result.purchase.seller?.id ?? "synthetic-invoice-provider";
  const claims = result.purchase.offer.claims?.join(", ") ?? result.purchase.offer.description;
  const purpose = isJapanese
    ? "請求書を抽出し、後続の会計処理を自動化する。"
    : result.purchase.purpose.description;
  const successCondition = isJapanese
    ? "60秒以内に、必須8項目と明細2件を含む読取り可能なJSONを返す。"
    : result.purchase.purpose.success_condition;
  const offer = isJapanese ? "合成された構造化請求書の抽出" : result.purchase.offer.description;
  const sellerPromise = isJapanese ? "機械可読JSON、請求書8項目、明細2件" : claims;
  const decisionChecks = result.decision.checks ?? [
    { id: "purchase_count", passed: true },
    { id: "total_amount", passed: true },
    { id: "allowed_protocol", passed: true },
  ];
  const checkTone = (check) => check?.passed ? "pass" : "fail";
  const checkWord = (check) => check?.passed ? traceCopy.words.passed : traceCopy.words.failed;
  const constraintRows = result.verification.constraint_checks.length
    ? result.verification.constraint_checks.map((check) => [
        `${traceCopy.labels.requirement} · ${traceCopy.checks[check.id] ?? check.id}`,
        displayConstraint(check),
        checkTone(check),
      ])
    : [[traceCopy.labels.requirement, traceCopy.words.noPayload, "wait"]];

  const cards = [
    traceCard("mandate", traceCopy.stages.mandate, [
      [traceCopy.labels.buyer, mandate.buyer_agent],
      [traceCopy.labels.purchases, isJapanese ? `${mandate.max_purchases}回` : `${mandate.max_purchases}`],
      [traceCopy.labels.budget, `${mandate.max_total_amount.currency} ${mandate.max_total_amount.amount}`],
      [traceCopy.labels.protocols, mandate.allowed_protocols.join(", ")],
      [traceCopy.labels.ticketLife, `${mandate.decision_ticket_ttl_seconds} ${traceCopy.words.seconds}`],
    ]),
    traceCard("decision", traceCopy.stages.decision, [
      [traceCopy.labels.purpose, purpose],
      [traceCopy.labels.success, successCondition],
      [traceCopy.labels.seller, isJapanese ? `合成請求書提供者（${seller}）` : seller],
      [traceCopy.labels.offer, offer],
      [traceCopy.labels.promise, sellerPromise],
      [traceCopy.labels.price, `${result.purchase.price.currency} ${result.purchase.price.amount}`],
      [traceCopy.labels.countCheck, checkWord(decisionChecks.find((item) => item.id === "purchase_count")), checkTone(decisionChecks.find((item) => item.id === "purchase_count"))],
      [traceCopy.labels.budgetCheck, checkWord(decisionChecks.find((item) => item.id === "total_amount")), checkTone(decisionChecks.find((item) => item.id === "total_amount"))],
      [traceCopy.labels.routeCheck, checkWord(decisionChecks.find((item) => item.id === "allowed_protocol")), checkTone(decisionChecks.find((item) => item.id === "allowed_protocol"))],
      [traceCopy.labels.decision, result.decision.action === "execute" ? traceCopy.words.authorized : result.decision.action, result.decision.action === "execute" ? "pass" : "fail"],
      [traceCopy.labels.ticket, `${traceCopy.words.singleUse} · ${result.decision.ticket_id}`],
    ]),
    traceCard("execution", traceCopy.stages.execution, [
      [traceCopy.labels.provider, isJapanese ? japanese.statuses[result.delivery.provider_status] ?? result.delivery.provider_status ?? traceCopy.words.unknown : result.delivery.provider_status ?? traceCopy.words.unknown],
      [traceCopy.labels.delivery, displayDelivery(result.delivery.payload_summary)],
      [traceCopy.labels.external, result.delivery.external_provider_called ? traceCopy.words.yes : traceCopy.words.no],
      [traceCopy.labels.money, result.sandbox.money_moved ? traceCopy.words.yes : traceCopy.words.no],
    ]),
    traceCard("verification", traceCopy.stages.verification, [
      ...constraintRows,
      [traceCopy.labels.outcome, displayOutcome(result.verification.state), tone(result.verification.state)],
      [traceCopy.labels.observation, isJapanese ? japanese.outcomes[result.verification.state]?.[1] ?? result.verification.observation : result.verification.observation],
    ]),
    traceCard("evidence", traceCopy.stages.evidence, [
      [traceCopy.labels.record, result.evidence_record?.id ?? traceCopy.words.unknown],
      [traceCopy.labels.stored, result.evidence_record?.persisted ? traceCopy.words.yes : traceCopy.words.responseOnly],
      [traceCopy.labels.credentials, result.evidence_record?.contains_provider_credentials ? traceCopy.words.yes : traceCopy.words.no],
      [traceCopy.labels.fraud, result.verification.fraud_conclusion === "not_determined" ? traceCopy.words.notDetermined : result.verification.fraud_conclusion],
      [traceCopy.labels.next, displayAction(result.verification.next_purchase_action)],
    ]),
  ];
  traceGrid.replaceChildren(...cards);
  traceEmpty.hidden = true;
  traceGrid.hidden = false;
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
  renderTrace(result);
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
