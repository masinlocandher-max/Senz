# SENZ consolidated development record

Date: 2026-10-28 (Asia/Manila). Development is coordinated through two independent reviews:

| Platform | Canonical review | Responsibility |
| --- | --- | --- |
| Website — `masinlocandher-max/Senz` | [PR #27](https://github.com/masinlocandher-max/Senz/pull/27) | Public brand, services, seven discovery routes, explained recommendations, quotation and inquiry intake. |
| App — private `masinlocandher-max/Senzapp` | [PR #5](https://github.com/masinlocandher-max/Senzapp/pull/5) | Existing eight products, protected workspaces, verified licensing, seats, usage and operations. |

## Superseded website drafts

- PR #24's sales-page direction is superseded by the website's unified catalog, solutions pages and discovery flow in #27.
- PR #26's six-product application prototype is not merged. The preserved eight-product private app is authoritative.
- Historical branches remain available; no source or Git history is deleted. SenzRebranded remains excluded.

The app review also incorporates its staging-readiness PR #4 and the equivalent dependency updates from PRs #1–3. Implementation details and private operational evidence remain in Senzapp.

## Release coordination

The website's application code and public catalog are unchanged by this consolidation. Its source check and 25 automated tests pass. Earlier mobile, accessibility and seven-route browser evidence is recorded in [RELEASE_REVIEW.md](RELEASE_REVIEW.md).

Keep both reviews separate and in draft until release gates are satisfied. Website CI passed on the prior implementation commit; app CI failed before a runner started, despite passing local checks. Review current GitHub checks before release.

Deploy and verify the compatible inquiry backend before publishing discovery. Verify actual inbox delivery, privacy/retention operations, approved commercial terms, app staging, live AI and payment/contract operations. Production publishing, DNS changes and paid resources require owner authorization.

The integration boundary is [PLATFORM_CONTRACT.md](PLATFORM_CONTRACT.md). Share descriptive product metadata only; do not copy private backend code or allow website answers to grant app access or set commercial prices.
