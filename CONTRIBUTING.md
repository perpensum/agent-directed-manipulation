# Contributing

**The most useful thing you can file here is a disagreement.**

This definition only works if independent implementations reach the same verdict on the same
input. Every place where they don't is a defect in the definition. Finding those is the point
of publishing it early.

日本語で書いてもらって構いません。

## Reporting a disagreement

Run the suite against your implementation:

```bash
node conformance/run.mjs <path-to-your-implementation>
```

If a case disagrees, first read its `clause` and `why` in
[`conformance/cases.json`](conformance/cases.json). They say what that provision is protecting.

**If you read them and still disagree, the definition is the more likely culprit.** Open an
issue with:

- the case id, or the HTML that produced the disagreement
- the verdict you reached (`findings` count and severity)
- the verdict you think is correct, and why

You do not need to have an implementation. A page that you believe is misclassified is enough.

## Reporting a false positive

**False positives are the only fatal failure for a standard like this.** If the definition —
or [`reference/scan.mjs`](reference/scan.mjs) — flags something legitimate, that is the highest
priority category of bug here.

Legitimate practices that must never be flagged are listed under "What it deliberately does not
detect" in the [README](README.md). If you find one that is flagged anyway, say so.

## Proposing a new case

Cases must be **mechanically decidable**. A case whose verdict depends on judging intent, tone,
or how overblown a claim is cannot be added — that is the axis the definition deliberately
refuses, and adding it would make the standard depend on who is measuring.

Every case needs: an `id`, a `lang`, the `clause` it pins down, a `why`, minimal `html`, and the
`expected` verdict. **English and Japanese are both in scope**; if your case exercises a rule in
one language only, say so, and a counterpart in the other is welcome.

## Proposing a change to the definition

Say what breaks without the change. Concretely:

- which real page is currently misclassified
- which cell of the severity matrix it lands in, and which one it should land in
- whether any existing conformance case would change verdict

**Changes that alter an existing verdict are a bigger deal than additions.** Prior versions are
never deleted; every change and its reason goes into [`CHANGELOG.md`](CHANGELOG.md).

## What is out of scope here

- Requests to evaluate, score, or investigate a specific named website. **This repository is the
  definition, not a service**, and publishing findings about identified operators is not
  something we do casually — a false positive aimed at a real business is unrecoverable
- Feature requests for a product. This repository deliberately contains no product

## Licensing of contributions

By contributing you agree that your contribution is licensed the same way as the file it lands
in: [CC BY 4.0](LICENSE) for the definition and documentation, [MIT](LICENSE-CODE) for
`conformance/run.mjs` and `reference/scan.mjs`.

**You do not need permission, notification, or certification from Perpensum to implement this
definition.** A standard that gatekeeps its own implementation is not a standard.
