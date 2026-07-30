# Changelog

All notable changes to this definition are recorded here.

**Revisions never delete prior versions.** A standard earns trust not by never changing, but
by making its changes traceable.

## [Unreleased]

Planned for v0.2:

- English `clause` and `why` strings in `conformance/cases.json` alongside the Japanese ones
- Any corrections arising from filed disagreements

## [0.1] — 2026-07-30

Initial release.

- The definition: two axes (region, visibility) and a four-cell severity matrix, with no
  subjective axis
- What counts as `hidden`, and the explicit exclusion of conditional CSS
- Inference rules for `third_party`, with the instruction to fall back to `first_party` when
  uncertain
- Six categories that are deliberately **not** detected
- Four stated limits, published rather than hidden behind a claim of detection
- `definition.json` — the same content as structured JSON, English and Japanese side by side
- `llms.txt` — index for machine readers
- `conformance/` — 23 cases, 18 of which expect no finding, plus a dependency-free runner
- `reference/scan.mjs` — a minimal reference implementation passing all 23 cases
- Licensing: CC BY 4.0 for the definition and its documentation, MIT for the runner

### Conformance suite, revision 3, and a false-positive fix (2026-07-31)

**Sweeping for false positives before wider distribution found three, and they shared a root
cause: the reference implementation checked whether a machine was *mentioned*, not whether one
was *addressed*.** The definition has always said the text must be "addressed to a machine
reader rather than a human one", and that merely mentioning AI is not a finding. The
implementation did not encode that distinction.

Flagged in error, all ordinary copy written for people:

- `Our AI assistant will always recommend the plan that fits your usage best.` — in a collapsed FAQ
- `Honestly the best AI assistant I have used. I would always recommend it to a friend.` — a review
- `The agent must have saved me ten hours.` — `must have` is an inference, not an obligation
- `Screen reader users should note the assistant output below.` — accessibility markup, addressed to humans

Changes:

- `reference/scan.mjs` now evaluates sentence by sentence and requires the machine to be either
  addressed by name or the subject carrying an obligation. `will`, `can`, and `would` describe;
  they no longer count as instructions. A possessive before the machine term ("our AI assistant")
  marks the sentence as describing a product to a person.
- Five negative cases added, pinning each pattern down (18 cases → 23; **18 of 23 now expect no
  finding**).
- **The same class of bug existed in the production engine** and was fixed there too: it treated
  `will always` as an obligation, so the collapsed-FAQ case flagged as `warn`.

**No existing verdict changed, and the definition text is unchanged.** Two independent
implementations shared this error, which is the argument for the suite carrying the cases.

### Conformance suite, revision 2 (2026-07-31)

**Revision 1 exercised several rules in Japanese only.** An English-only implementation could
pass it without being tested, or could fail `quadrant-fp-hidden` for a reason that was not its
fault — while the definition states that both English and Japanese are in scope. That is a
defect in the suite, not in anyone's implementation.

- Added an English counterpart for every Japanese-only case: `quadrant-fp-hidden-en`,
  `negative-ai-mention-en`, `negative-media-query-en`, `negative-print-query-en`,
  `undetermined-external-css-en` (13 cases → 18)
- Added a `lang` field to every case; the runner now reports agreement per language, so
  passing one language while failing the other cannot hide inside a single total
- `clause` and `why` are now English, with `clause_ja` and `why_ja` alongside. This closes the
  gap the first release had recorded as deferred to v0.2
- The definition itself is unchanged. **No verdict in revision 1 was altered.**

### Notes on this release

- The first publication of the prose (2026-07-30) said a license notice was "not yet decided
  and will be stated in v0.2". It was settled as CC BY 4.0 before any external distribution
  began, so it is recorded here as part of v0.1 rather than deferred. No citation had
  accumulated at that point: the definition had been published but never promoted.

- Published first at a temporary URL and moved to <https://perpensum.org/> on the same day,
  before any external citations had accumulated.
- English is the authoritative language. The Japanese text is a translation of record; where
  the two diverge, the English text governs. The definition was originally drafted in Japanese,
  which is why `conformance/cases.json` still carries Japanese-only annotations in v0.1.

[Unreleased]: https://github.com/perpensum/agent-directed-manipulation/compare/v0.1...HEAD
[0.1]: https://github.com/perpensum/agent-directed-manipulation/releases/tag/v0.1
