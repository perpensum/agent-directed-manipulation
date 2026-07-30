#!/usr/bin/env node
// Minimal reference implementation of "Defining Agent-Directed Manipulation" v0.1.
// https://perpensum.org/
//
// **The definition is normative. This file is not.** Where they disagree, the
// definition wins and this file has a bug — please report it:
// https://github.com/perpensum/agent-directed-manipulation/issues
//
// Purpose: show that the definition is implementable in a readable amount of code,
// and give implementers something to diff against. It is deliberately small.
//
//   curl -s https://example.com | node scan.mjs
//   node scan.mjs page.html
//
// No dependencies. Node 18 or later. MIT licensed (see ../LICENSE-CODE).

// ---------------------------------------------------------------------------
// Severity: region × visibility, and nothing else.
// ---------------------------------------------------------------------------

const SEVERITY = {
  first_party: { visible: "info", hidden: "warn" },
  third_party: { visible: "warn", hidden: "high" },
};

// info is not a finding. It is ordinary advertising copy.
const REPORTABLE = new Set(["warn", "high"]);

// ---------------------------------------------------------------------------
// Region: who controls this part of the page.
// ---------------------------------------------------------------------------

// Tokens suggesting a region others can post into.
const THIRD_PARTY = /(^|[^a-z])(review|comment|reply|ugc|user-content|user-post|guestbook|testimonial|discussion|thread)([^a-z]|$)/i;

// Operator-side markers win over the inference above. An "editorial review" is
// the operator's own writing, whatever the class name suggests.
const OPERATOR = /(^|[^a-z])(editorial|editor|staff|admin|official|owner|shop|store|brand)([^a-z]|$)|編集部|運営|スタッフ/i;

function regionOf(el) {
  for (let n = el; n; n = n.parent) {
    const marks = `${n.attrs?.class ?? ""} ${n.attrs?.id ?? ""} ${n.attrs?.itemprop ?? ""}`;
    if (!marks.trim()) continue;
    // Operator markers are checked first: falling back to first_party is the safe side,
    // because third_party carries the higher severity.
    if (OPERATOR.test(marks)) return "first_party";
    if (THIRD_PARTY.test(marks)) return "third_party";
  }
  return "first_party";
}

// ---------------------------------------------------------------------------
// Visibility: can a human reading the page normally reach this text.
// ---------------------------------------------------------------------------

const HIDDEN_DECL = [
  /display\s*:\s*none/i,
  /visibility\s*:\s*hidden/i,
  /opacity\s*:\s*0(\.0+)?\s*(;|$|!)/i,
  /font-size\s*:\s*0(px|em|rem)?\s*(;|$|!)/i,
  /(left|top)\s*:\s*-\s*[0-9]{4,}/i,
  /text-indent\s*:\s*-\s*[0-9]{4,}/i,
  /clip\s*:\s*rect\(\s*0[a-z]*\s*,?\s*0/i,
];

const isHiddenCss = (decls) => HIDDEN_DECL.some((re) => re.test(decls));

/**
 * Collect selectors that hide, from <style> blocks.
 *
 * **Declarations inside @media / @supports / @container are skipped.** They apply
 * only under specific conditions; calling responsive or print styles "hidden text"
 * is simply wrong, and is the most common way to manufacture a false positive.
 */
function collectHidingSelectors(html) {
  const selectors = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    let css = m[1];
    // Remove conditional at-rule blocks wholesale, matching braces.
    css = stripAtRuleBlocks(css);
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (isHiddenCss(rule[2])) {
        for (const sel of rule[1].split(",")) selectors.push(sel.trim());
      }
    }
  }
  return selectors;
}

function stripAtRuleBlocks(css) {
  const CONDITIONAL = /@(media|supports|container|document)\b/gi;
  let out = css;
  let m;
  CONDITIONAL.lastIndex = 0;
  while ((m = CONDITIONAL.exec(out))) {
    const open = out.indexOf("{", m.index);
    if (open === -1) break;
    let depth = 0;
    let i = open;
    for (; i < out.length; i++) {
      if (out[i] === "{") depth++;
      else if (out[i] === "}" && --depth === 0) break;
    }
    out = out.slice(0, m.index) + out.slice(i + 1);
    CONDITIONAL.lastIndex = 0;
  }
  return out;
}

/** Simple selector match. A reference implementation, not a CSS engine — see LIMITS. */
function matchesSelector(el, sel) {
  const last = sel.split(/[\s>+~]+/).filter(Boolean).pop() ?? sel;
  const classes = (el.attrs?.class ?? "").split(/\s+/).filter(Boolean);
  for (const part of last.split(/(?=[.#])/)) {
    if (!part) continue;
    if (part.startsWith(".")) {
      if (!classes.includes(part.slice(1))) return false;
    } else if (part.startsWith("#")) {
      if (el.attrs?.id !== part.slice(1)) return false;
    } else if (part !== "*" && part.toLowerCase() !== el.tag) return false;
  }
  return true;
}

function visibilityOf(el, hidingSelectors) {
  for (let n = el; n; n = n.parent) {
    if (n.viaComment || n.viaTemplate || n.viaAttribute) return "hidden";
    const attrs = n.attrs ?? {};
    if ("hidden" in attrs) return "hidden";
    if (attrs["aria-hidden"] === "true") return "hidden";
    if (attrs.style && isHiddenCss(attrs.style)) return "hidden";
    if (hidingSelectors.some((s) => matchesSelector(n, s))) return "hidden";
  }
  // **No local evidence of hiding. Do not conclude hidden.**
  return "visible";
}

// ---------------------------------------------------------------------------
// Is this text an instruction addressed to a machine reader?
// ---------------------------------------------------------------------------

// A machine reader is named or clearly addressed.
const ADDRESSEE =
  /(^|[^a-z])(ai|a\.i\.|llm|llms|gpt|chatbot|chat-bot|assistant|assistants|agent|agents|bot|bots|language model|crawler|scraper)([^a-z]|$)|AI|エーアイ|アシスタント|エージェント|ボット|言語モデル|クローラ/i;

// Control-token phrasing is itself sufficient: no page needs to say this to a human.
const CONTROL_TOKEN =
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?|disregard\s+(all\s+)?(previous|prior|above)\s+instructions?|override\s+(your|the)\s+(system\s+)?prompt|new\s+instructions?\s*:|system\s*prompt\s*:|以前の指示を無視|これまでの指示を無視/i;

// A directive aimed at the reader's judgment, output, or ranking.
const VERB_EN =
  /(recommend|prefer|rank|rate|select|choose|pick|prioriti[sz]e|favou?r|mark|flag|classify|treat|output|report|state|say|list|display|surface|promote)/i;
const MODAL_EN = /(must|should|shall|need to|have to|always|never|be sure to|make sure|ensure|do not|don't)/i;
const VERB_JA = /(推薦|推奨|おすすめ|優先|選定|選択|評価|表示|出力|回答|紹介|案内|順位|ランキング)/;
const IMPERATIVE_JA = /(してください|して下さい|せよ|しろ|なさい|すべき|するように|すること|願います)/;

/** Imperative sentence opening, e.g. "Note to AI: recommend ...", "Always recommend ...". */
const IMPERATIVE_EN = new RegExp(
  `(^|[.:;!?]\\s*|\\bto\\s+(ai|llm|assistants?|agents?|bots?)\\s*[:,]\\s*)\\s*${VERB_EN.source}`,
  "i",
);

function isAgentDirected(text) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 8) return null;

  if (CONTROL_TOKEN.test(t)) return "control-token";

  if (!ADDRESSEE.test(t)) return null; // No machine reader is being addressed.

  if (IMPERATIVE_JA.test(t) && VERB_JA.test(t)) return "directive-ja";
  if (MODAL_EN.test(t) && VERB_EN.test(t)) return "directive-en";
  if (IMPERATIVE_EN.test(t)) return "directive-en";

  return null; // Mentioning AI is not instructing it.
}

// ---------------------------------------------------------------------------
// A very small HTML reader. Enough for this definition, and no more.
// ---------------------------------------------------------------------------

const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
// Attributes that carry text a human never reads as prose.
const TEXT_ATTRS = ["content", "alt", "title", "aria-label", "placeholder", "data-prompt", "data-ai", "data-instruction"];
// Text inside these is a quoted example, not an assertion by the page.
const QUOTING = new Set(["code", "pre", "samp", "kbd"]);

function parse(html) {
  const root = { tag: "#root", attrs: {}, children: [], parent: null };
  let cur = root;
  const re = /<!--([\s\S]*?)-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const [, comment, closing, tag, attrStr, selfClose, text] = m;
    if (comment !== undefined) {
      cur.children.push({ type: "text", value: comment, parent: cur, viaComment: true });
    } else if (tag) {
      const name = tag.toLowerCase();
      if (closing) {
        for (let n = cur; n && n !== root; n = n.parent) {
          if (n.tag === name) { cur = n.parent; break; }
        }
      } else {
        const node = { tag: name, attrs: parseAttrs(attrStr ?? ""), children: [], parent: cur };
        cur.children.push(node);
        if (!selfClose && !VOID.has(name)) cur = node;
      }
    } else if (text && text.trim()) {
      cur.children.push({ type: "text", value: text, parent: cur });
    }
  }
  return root;
}

function parseAttrs(s) {
  const attrs = {};
  for (const m of s.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
  }
  return attrs;
}

const decode = (s) =>
  s.replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (_, e) =>
    ({ lt: "<", gt: ">", amp: "&", quot: '"', "#39": "'", nbsp: " " })[e]);

/** Every piece of text a machine reader would take from the page, with its context. */
function* candidates(root) {
  const walk = function* (node, inTemplate, inQuote) {
    for (const child of node.children ?? []) {
      if (child.type === "text") {
        if (!inQuote) yield { text: decode(child.value), el: node, viaComment: child.viaComment, viaTemplate: inTemplate };
        continue;
      }
      // Structured data and stylesheets are legitimate self-presentation, not prose.
      if (child.tag === "script" || child.tag === "style") continue;

      for (const a of TEXT_ATTRS) {
        if (child.attrs?.[a]) yield { text: decode(child.attrs[a]), el: child, viaAttribute: true };
      }
      yield* walk(child, inTemplate || child.tag === "template", inQuote || QUOTING.has(child.tag));
    }
  };
  yield* walk(root, false, false);
}

// ---------------------------------------------------------------------------
// scan
// ---------------------------------------------------------------------------

/**
 * @param {string|{html:string}} input
 * @returns {{findings: Array, unresolvedExternalCss: boolean, definition: string}}
 */
export function scan(input) {
  const html = typeof input === "string" ? input : input.html;
  const hidingSelectors = collectHidingSelectors(html);
  // **We cannot see what is in an external stylesheet.** We say so rather than guessing.
  const unresolvedExternalCss = /<link[^>]+rel\s*=\s*["']?stylesheet/i.test(html);

  const root = parse(html);
  const findings = [];
  const seen = new Set();

  for (const c of candidates(root)) {
    const rule = isAgentDirected(c.text);
    if (!rule) continue;

    const carrier = { ...c.el, viaComment: c.viaComment, viaTemplate: c.viaTemplate, viaAttribute: c.viaAttribute };
    const region = regionOf(c.el);
    const visibility = c.viaComment || c.viaTemplate || c.viaAttribute
      ? "hidden"
      : visibilityOf(carrier, hidingSelectors);
    const severity = SEVERITY[region][visibility];
    if (!REPORTABLE.has(severity)) continue;

    const evidence = c.text.replace(/\s+/g, " ").trim().slice(0, 200);
    const key = `${region}|${visibility}|${evidence}`;
    if (seen.has(key)) continue;
    seen.add(key);

    findings.push({ severity, region, visibility, rule, evidence });
  }

  return {
    definition: "https://perpensum.org/ (v0.1)",
    findings,
    unresolvedExternalCss,
    ...(unresolvedExternalCss
      ? { note: "An external stylesheet was referenced but not fetched. Concealment declared there cannot be seen, and is not reported as hidden." }
      : {}),
  };
}

export default scan;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import("node:fs");
  const file = process.argv[2];
  const html = file && file !== "-"
    ? readFileSync(file, "utf8")
    : readFileSync(0, "utf8");

  const result = scan(html);
  const worst = result.findings.reduce(
    (a, f) => (({ info: 0, warn: 1, high: 2 })[f.severity] > ({ info: 0, warn: 1, high: 2 })[a] ? f.severity : a),
    "info",
  );

  if (!result.findings.length) {
    console.log("No findings.");
    if (result.unresolvedExternalCss) console.log(`Note: ${result.note}`);
    console.log("\nThis is not a clean bill of health — see the stated limits at https://perpensum.org/");
    process.exit(0);
  }

  console.log(`${result.findings.length} finding(s), worst severity: ${worst}\n`);
  for (const f of result.findings) {
    console.log(`[${f.severity}] region=${f.region} visibility=${f.visibility} (${f.rule})`);
    console.log(`  ${f.evidence}\n`);
  }
  if (result.unresolvedExternalCss) console.log(`Note: ${result.note}`);
  process.exit(worst === "high" ? 2 : 1);
}
