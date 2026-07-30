# Conformance Suite — Defining Agent-Directed Manipulation v0.1

**A standard is only a standard once everyone measuring reaches the same verdict.**
This suite checks whether your implementation agrees with the definition.

日本語版: [`README.ja.md`](README.ja.md)

## Running it

```bash
node run.mjs <path-to-your-implementation>
```

Your implementation exports a function under one of `default`, `scan`, or `scanHtml`,
in either of these shapes:

```js
(html)     => ({ findings: [{ severity: "info" | "warn" | "high" }] })
({ html }) => ({ findings: [{ severity: "info" | "warn" | "high" }] })
```

**Either is fine.** The argument shape is not part of the definition, so the runner tries
both and keeps whichever works.

**Severity is compared using the maximum across findings.** The ordering of `findings` is
not part of the definition either.

No dependencies. Node 18 or later. Exit code is `0` when every case agrees and `1` otherwise.

## What is in it

`cases.json` holds 23 cases. It contains both **what must be detected and what must not be**.

| Group | Cases | What it pins down |
|---|---:|---|
| Four quadrants | 5 | That severity follows mechanically from region × visibility |
| Not detected | 15 | Advertising copy, structured data, AI mentions, hidden-but-harmless text, genuine reviews, conditional CSS |
| Not escalated | 1 | That an editorial review stays `first_party` and does not become `high` |
| Not concluded | 2 | That unresolvable external CSS is not declared hidden |
| **Total** | **23** | |

**18 of the 23 expect no finding at all, and that imbalance is deliberate.**
The substance of this standard lies more in what it does not flag than in what it does.
For a judgement like this one, false positives are the only fatal failure.

### Both languages are exercised

Every case carries a `lang` field, and the runner reports the split:

```
Definition v0.1 conformance: 23 / 23 agree (call form: scan(html))
  by language: ja 8/8  en 13/13  ja+en 1/1  n/a 1/1
```

**Revision 1 of this suite tested several rules in Japanese only.** An English-only
implementation could pass it without ever being exercised — or fail `quadrant-fp-hidden` for a
reason that was not its fault. Revision 2 adds an English counterpart for every such case.
Both languages are in scope for the definition, so both are in scope for the suite.

## If you disagree

**Your implementation is not necessarily the one that is wrong.**

A disagreement marks a place where the definition is open to more than one reading.
Each case in `cases.json` carries a `clause` and a `why` describing what that provision is
trying to protect. If you read them and remain unconvinced, **the definition is the more
likely culprit** — please [open an issue](https://github.com/perpensum/agent-directed-manipulation/issues).

**A standard earns trust not by never changing, but by making its changes traceable.**

## A reference implementation is included

[`../reference/scan.mjs`](../reference/scan.mjs) implements the definition in one dependency-free
file and passes all 23 cases. Diff your verdicts against it when a case disagrees.

**It is not normative.** Where it and the definition disagree, the reference implementation has
the bug.

## License

`cases.json` is [CC BY 4.0](../LICENSE), like the rest of the definition.
**`run.mjs` is [MIT](../LICENSE-CODE)**, so you can vendor it into a build pipeline without
carrying a content license through your toolchain.

## Version

v0.1 (2026-07-30). The definition: <https://perpensum.org/> (English, authoritative) /
<https://perpensum.org/ja> (日本語).
