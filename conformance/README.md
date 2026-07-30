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

`cases.json` holds 13 cases. It contains both **what must be detected and what must not be**.

| Group | Cases | What it pins down |
|---|---:|---|
| Four quadrants | 4 | That severity follows mechanically from region × visibility |
| Not detected | 7 | Advertising copy, structured data, AI mentions, hidden-but-harmless text, genuine reviews, conditional CSS, editorial reviews |
| Not concluded | 1 | That unresolvable external CSS is not declared hidden |
| **Total** | **13** | |

**That the negative side is the largest group, at seven, is deliberate.**
The substance of this standard lies more in what it does not flag than in what it does.
For a judgement like this one, false positives are the only fatal failure.

## If you disagree

**Your implementation is not necessarily the one that is wrong.**

A disagreement marks a place where the definition is open to more than one reading.
Each case in `cases.json` carries a `clause` and a `why` describing what that provision is
trying to protect. If you read them and remain unconvinced, **the definition is the more
likely culprit** — please [open an issue](https://github.com/perpensum/agent-directed-manipulation/issues).

**A standard earns trust not by never changing, but by making its changes traceable.**

## Known gap in v0.1

The `clause` and `why` fields in `cases.json` are written in Japanese, because the definition
was drafted in Japanese first. English strings will be added alongside them in v0.2.
The case HTML, the expected verdicts, and the runner are language-independent, so the suite
runs correctly either way.

## License

`cases.json` is [CC BY 4.0](../LICENSE), like the rest of the definition.
**`run.mjs` is [MIT](../LICENSE-CODE)**, so you can vendor it into a build pipeline without
carrying a content license through your toolchain.

## Version

v0.1 (2026-07-30). The definition: <https://perpensum.org/> (English, authoritative) /
<https://perpensum.org/ja> (日本語).
