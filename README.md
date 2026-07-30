# Defining Agent-Directed Manipulation

**A reproducible definition that separates agent-directed manipulation from legitimate
machine-readable self-presentation.**

- Definition (authoritative): <https://perpensum.org/>
- 定義（日本語）: <https://perpensum.org/ja>
- Structured form: [`definition.json`](definition.json)
- Conformance suite: [`conformance/`](conformance/) — 26 cases
- Status: **v0.1, draft**, published 2026-07-30

日本語版の README: [`README.ja.md`](README.ja.md)

---

## The problem

AI agents now read web pages and act on them — comparing, recommending, buying. In response,
a practice has emerged: **placing text that is invisible to human readers, or planted in
third-party regions of a page, in order to steer the machine's judgment.**

At the same time, making yourself machine-readable — structured data, `llms.txt`, clear
specifications — is a legitimate practice. **The two must not be confused.** Conflating them
is how a detector becomes a liability: it starts flagging honest sites.

This document draws the line, so that anyone measuring the same page arrives at the same verdict.

## The definition

> **Agent-directed manipulation** is text on a web page that is addressed to a machine reader
> rather than a human one, and that is either **(a) placed where humans cannot see it** or
> **(b) placed in a third-party submission region**, and that instructs the reader's judgment,
> output, or ranking.

## Two axes, and only two

| Axis | Values |
|---|---|
| **Region** | `first_party` (the operator's own surface) / `third_party` (regions others can post into) |
| **Visibility** | `visible` (readable under normal rendering) / `hidden` (a human reader will not reach it) |

| Region | Visibility | Severity | Reading |
|---|---|---|---|
| `first_party` | `visible` | `info` | Ordinary advertising copy. Not a finding |
| `first_party` | `hidden` | `warn` | Hidden text. Equivalent to search-engine cloaking |
| `third_party` | `visible` | `warn` | Someone else placed an agent-directed instruction |
| `third_party` | `hidden` | `high` | Invisible injection by a third party |

**No subjective axis is involved.** Add one — "is this overblown?" — and the line against
legitimate advertising copy disappears; the verdict starts depending on who is measuring.
For this to work as a standard, every axis has to be mechanically decidable.

## What it deliberately does not detect

Include any one of these and the standard becomes unusable:

- Ordinary advertising copy ("The best choice", "Trusted by thousands", "Buy now")
- Structured data, `llms.txt`, `robots.txt` — legitimate machine-readable self-presentation is clean
- Merely mentioning AI
- Hidden but harmless text — skip links, screen-reader-only text, cookie banners, collapsed
  accordions and tabs, inactive carousel slides
- Genuine first-person reviews
- Articles explaining prompt injection

**Conditional CSS is not hidden.** Declarations inside `@media`, `@supports`, or `@container`
apply only under specific conditions. Calling responsive layout or print styles "hidden text"
is simply wrong.

**When external CSS cannot be resolved, do not conclude hidden.** Report the visibility as
undetermined. Treating what you cannot resolve as a finding is how false positives are manufactured.

## Known limits

Stated in the open, not hidden behind a claim of detection:

- Concealment placed in external CSS cannot be detected without fetching that CSS
- Visibility controlled by JavaScript at runtime is not evaluated
- Third-party region detection is inference, not certainty
- Languages other than English and Japanese are out of scope for now

**Reporting "nothing found" when you did not look is the worst failure mode available to a
standard like this.**

## Try it in thirty seconds

A minimal reference implementation ships with the definition. No install, no dependencies:

```bash
curl -s https://example.com | node reference/scan.mjs
```

**The definition is normative; [`reference/scan.mjs`](reference/scan.mjs) is not.** Where they
disagree, the reference implementation has the bug. It exists to show that the definition is
implementable in a readable amount of code, and to give you something to diff against.

## Verifying an implementation

```bash
node conformance/run.mjs <path-to-your-implementation>
```

**26 cases, and 20 of them expect no finding at all** — what this standard does *not* flag is
more of its substance than what it does. Both English and Japanese are exercised, and the
runner reports the split, because passing one language while failing the other should not hide
inside a single total. No dependencies; Node 18 or later.

See [`conformance/README.md`](conformance/README.md) for the interface your implementation
should expose.

## If you disagree

**Your implementation is not necessarily the one that is wrong.** A disagreement marks a place
where the definition is open to more than one reading — which is a defect in the definition.

Please [open an issue](https://github.com/perpensum/agent-directed-manipulation/issues).
Disagreements are the main thing this repository is for. See [CONTRIBUTING.md](CONTRIBUTING.md).

## If you want your own site watched

A one-off check is not the useful thing — **being told when something changes is.** Third-party
regions are exactly where you are not looking.

Perpensum is building that continuous check. **It does not exist as a product yet**, and there is
no date, no price, and no waitlist that guarantees anything. If you want it,
[say so on #4](https://github.com/perpensum/agent-directed-manipulation/issues/4). A comment is
the whole mechanism — no form, no email address, no signup.

## Open questions we do not have answers to

These are filed by the authors, in the open, because v0.1 is published to be argued with:

- [#1 Runtime JavaScript visibility is out of scope — should it be?](https://github.com/perpensum/agent-directed-manipulation/issues/1)
- [#2 Is `alt` really hidden? Screen readers reach it](https://github.com/perpensum/agent-directed-manipulation/issues/2)
- [#3 `third_party` inference is English-shaped, and under-reports on everything else](https://github.com/perpensum/agent-directed-manipulation/issues/3)

**#3 in particular needs knowledge one author cannot have**: the class and id conventions that
comment and review systems use in languages we have not enumerated.

## Status and licensing

- **v0.1 is explicitly a draft.** It is published early so that it can be argued with.
- **The definition, this documentation, `definition.json`, and `conformance/cases.json` are
  licensed under [CC BY 4.0](LICENSE).** Quote, implement, translate, and build on them
  freely; attribute the source. If you distribute a modified version, state how it differs.
- **The runner (`conformance/run.mjs`) is licensed under [MIT](LICENSE-CODE)** so it can be
  vendored into a build pipeline without the attribution requirements of a content license.
- Revisions will not delete prior versions. Changes and their reasons stay on the record in
  [`CHANGELOG.md`](CHANGELOG.md).

**Implementing this definition does not require permission, notification, or certification
from Perpensum.** A standard that gatekeeps its own implementation is not a standard.

## Who publishes this

Perpensum (<https://perpensum.org/>), which is building third-party evaluation of AI agent
purchasing decisions.

**Stated plainly because a standard whose authorship is unclear does not get adopted.** The
relevant commitment is not anonymity but independence: Perpensum does not accept payment,
partnership, or preferential terms from any party in exchange for how that party is evaluated
under this definition.

This repository is the source of the definition itself. It is deliberately separate from any
product: the definition is meant to be implementable by anyone, including competitors.
