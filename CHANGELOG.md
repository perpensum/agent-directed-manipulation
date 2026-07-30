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
- `conformance/` — 13 cases, seven of them negative, plus a dependency-free runner
- Licensing: CC BY 4.0 for the definition and its documentation, MIT for the runner

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
