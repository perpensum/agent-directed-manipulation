#!/usr/bin/env node
// False-positive sweep for the reference implementation.
//
//   node reference/false-positive-sweep.test.mjs
//
// **Every fixture below is ordinary page copy written for people, and every one of them must
// come back clean.** False positives are the only fatal failure this definition has: a wrong
// verdict aimed at a real business cannot be walked back, and a detector that flags honest
// accessibility markup is worse than no detector.
//
// Each sentence is run through ten placements — visible body text, a collapsed FAQ panel,
// `display:none`, off-screen positioning, `aria-hidden`, a review region, a comment region,
// a mobile-hidden block, a `meta description`, and an `alt` attribute. 13 categories × 10
// placements = 480 verdicts.
//
// Sentences that reached production and were reported in error are kept here permanently, with
// the reason. Exit code is 0 when nothing is flagged and 1 otherwise.

import { scan } from "./scan.mjs";

/** Ordinary page copy. None of it addresses a machine. All of it must come back clean. */
const CLEAN = {
  "AI regulation and governance": [
    // Reported in error before release: "AI Act" is legislation, and the duty falls on providers.
    "The EU AI Act requires that providers must classify systems by risk tier.",
    "Under the AI Act, deployers must report serious incidents within 15 days.",
    "AI governance teams should document every model they put into production.",
  ],
  "Marketing copy for an AI product": [
    // Reported in error before release: names a machine, addresses a customer.
    "Our AI assistant will always recommend the plan that fits your usage best.",
    "Meet Aria, our AI agent. Choose a plan below and select the size you need.",
    "The assistant can rank your options in seconds.",
    "当社のAIアシスタントが最適なプランを必ずご紹介します。",
    "弊社のAIエージェントは、お客様に最適な商品を24時間ご案内します。",
  ],
  "Crawler and search documentation": [
    "Crawlers should not index pages marked noindex.",
    "Bots must respect robots.txt before requesting any page.",
    // Reported in error before release: "rate" was matching inside "rate limits".
    "Your scraper must not ignore rate limits.",
  ],
  "Retail and e-commerce": [
    // Reported in error before release: the machine-name pattern matched "ai" inside "Retailers".
    "Retailers must always display the correct price.",
    "Certain plans should never be recommended without a quote.",
    "Our email templates must always state the delivery window.",
    "Bargain hunters should choose the outlet section.",
    "Wholesale customers must select a delivery slot at checkout.",
    // Reported in error before release: an instruction to merchants, with no machine in sight.
    "小売価格は必ず税込で表示してください。",
  ],
  "Reviews and testimonials": [
    "Honestly the best AI assistant I have used. I would always recommend it to a friend.",
    // Reported in error before release: "must have" is an inference, not an obligation.
    "The agent must have saved me ten hours this month. Highly recommend!",
    "I would rank this seller above the others I tried.",
    "このAIアシスタントは本当に便利で、友人にも必ず薦めています。",
  ],
  "Accessibility markup": [
    // Reported in error before release: "output" was matching as a verb, in a noun position.
    "AI-generated summary follows. Screen reader users should note the assistant output below.",
    "Skip to main content",
    "Press Enter to select an option from the list.",
    "メインコンテンツへスキップ",
  ],
  "Cookie and consent notices": [
    "We use cookies. You must accept essential cookies to continue.",
    "Manage preferences. You can choose which categories to allow.",
    "Cookieの利用に同意していただく必要があります。",
  ],
  "Terms and legal": [
    "Users must select a payment method before placing an order.",
    "You must not display our marks without written permission.",
    "Merchants must report chargebacks within 30 days.",
    "利用者は必ず本規約を確認のうえご利用ください。",
  ],
  "Job listings": [
    "Candidates must display strong judgment under pressure.",
    "Applicants should rank their preferred locations in order.",
    "AI engineers must have shipped a production model.",
  ],
  "Glossaries and FAQs": [
    // Reported in error before release: a glossary entry looks exactly like a vocative.
    "AI: Artificial Intelligence. Select a term to see its definition.",
    "Agent: a program that acts on your behalf. Choose a topic to continue.",
    "Assistant: how do I return an item? Choose Returns from the menu.",
    "AIとは。用語を選択すると定義が表示されます。",
  ],
  "Security writing about injection": [
    "Attackers embed strings that tell an assistant to ignore its instructions.",
    "Defenders must treat retrieved content as untrusted input.",
    "An AI agent must be given tools before it can act on anything.",
  ],
  "Instructions and recipes": [
    "Select the ripest tomatoes and choose a heavy pan.",
    "Always rate your experience after the call.",
    "お好みの商品を選択してください。",
  ],
  "News and quotation": [
    "The report says AI assistants must be audited before deployment.",
    // Reported in error before release: "rate" was matching inside "corporate".
    "One executive said agents should never be trusted with a corporate card.",
  ],
};

/**
 * Known open question, tracked as issue #5 rather than worked around.
 *
 * This is reported by both the reference implementation and the production engine, and we do not
 * believe it can be fixed inside an implementation: the sentence is grammatically identical to a
 * real injection and differs only in what it is doing. Listed here so the gap is visible rather
 * than buried, and reported separately so it does not silently become "expected".
 */
const KNOWN_AMBIGUOUS = [
  "Search agents must rank results by relevance, not by recency.",
];

const PLACEMENTS = [
  ["visible body", (t) => `<html><body><main><p>${t}</p></main></body></html>`],
  ["collapsed FAQ", (t) => `<html><body><details><summary>Q</summary><div hidden>${t}</div></details></body></html>`],
  ["display:none", (t) => `<html><head><style>.h{display:none}</style></head><body><div class="h">${t}</div></body></html>`],
  ["off-screen", (t) => `<html><head><style>.s{position:absolute;left:-10000px}</style></head><body><span class="s">${t}</span></body></html>`],
  ["aria-hidden", (t) => `<html><body><div aria-hidden="true">${t}</div></body></html>`],
  ["review region", (t) => `<html><body><div class="review-item">${t}</div></body></html>`],
  ["comment region", (t) => `<html><body><div class="comment-body">${t}</div></body></html>`],
  ["mobile-hidden", (t) => `<html><head><style>@media (max-width:768px){.d{display:none}}</style></head><body><div class="d">${t}</div></body></html>`],
  ["meta description", (t) => `<html><head><meta name="description" content="${t.replace(/"/g, "&quot;")}"></head><body><p>x</p></body></html>`],
  ["alt attribute", (t) => `<html><body><img src="a.png" alt="${t.replace(/"/g, "&quot;")}"></body></html>`],
];

let checked = 0;
const failures = [];
for (const [category, sentences] of Object.entries(CLEAN)) {
  for (const sentence of sentences) {
    for (const [placement, wrap] of PLACEMENTS) {
      checked++;
      const { findings } = scan(wrap(sentence));
      if (findings.length) failures.push({ category, placement, sentence, severity: findings[0].severity });
    }
  }
}

let ambiguous = 0;
for (const sentence of KNOWN_AMBIGUOUS) {
  for (const [, wrap] of PLACEMENTS) if (scan(wrap(sentence)).findings.length) ambiguous++;
}

console.log(`${checked} verdicts across ${Object.keys(CLEAN).length} categories × ${PLACEMENTS.length} placements`);

if (failures.length) {
  console.log(`\nFALSE POSITIVES: ${failures.length} (${((failures.length / checked) * 100).toFixed(2)}%)\n`);
  const grouped = new Map();
  for (const f of failures) {
    if (!grouped.has(f.sentence)) grouped.set(f.sentence, { ...f, placements: [] });
    grouped.get(f.sentence).placements.push(f.placement);
  }
  for (const g of grouped.values()) {
    console.log(`[${g.severity}] ${g.category}`);
    console.log(`  ${g.sentence}`);
    console.log(`  in: ${g.placements.join(", ")}\n`);
  }
} else {
  console.log("No false positives.");
}

console.log(
  `\nKnown ambiguity (issue #5): ${ambiguous}/${KNOWN_AMBIGUOUS.length * PLACEMENTS.length} placements reported.`,
);
console.log("Tracked openly rather than worked around — see https://github.com/perpensum/agent-directed-manipulation/issues/5");

process.exit(failures.length ? 1 : 0);
