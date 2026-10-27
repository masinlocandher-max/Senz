# SENZ website release review

This review branch builds on the existing commercial website branch, preserving its ancestry, agent routing fix, and institutional pathway. It does not merge the earlier six-product application draft.

## Implemented

- Homepage with Get Started leading to discovery; problem-led solutions, audience pathways, strategic communications, digital solutions and the actual eight-product catalog.
- Seven adaptive audience routes (seven core questions; an eighth context question for Other), back/edit controls, explained recommendations, proposed tier scopes, limitations and contact-after-results.
- Quote/demo/institutional inquiry actions only. No invented prices, live checkout, or access grants.
- Website-side validation recomputes recommendations and preserves consented answers in the existing email intake workflow. No public inquiry listing or database.
- Public catalog metadata exported from the private eight-product app; no private app code copied.
- Unsupported published price benchmarks, unverified educational/address metadata, and fictional music chart/artist placeholders removed from public pages. Existing public page URLs retained.
- Static Node server denies backend, Git, environment, and test files; immutable caching removed from mutable unversioned assets; delivery requires explicit provider acknowledgement.
- Independent website CI, sitemap additions, public metadata and platform integration contract.

## Evidence

`npm run check` and 25 automated tests pass. All seven audience browser journeys reach a meaningful result and submit the original answers to a local intercepted delivery response. Back/edit is exercised. Twelve public pages pass automated WCAG A/AA checks at 320, 390, 768 and 1440px with no horizontal overflow. Screenshots inspected at mobile and desktop sizes. All local HTML file references resolve. Browser plugin unavailable; Playwright and local Chromium used. No live inquiry was sent. Existing hidden-focus banner and keyboard-scrollable card rail issues were repaired.

## Release order and blockers

Review this PR alongside the private Senzapp access/catalog PR. Deploy and verify the compatible inquiry backend before publishing the discovery UI; otherwise the old backend cannot guarantee the structured recommendation contract. Independently verify actual inbox delivery, retention and privacy processes. Obtain owner approval before merging to a branch that triggers production publishing. This change does not deploy the website or app, activate checkout, change DNS, approve commercial prices or provision paid services.

Manual lead lifecycle: private SENZ inbox, submission reference, New → Reviewing → Quote sent → Accepted/Declined. Commercial activation occurs only in the private app after separate verification. See PLATFORM_CONTRACT.md.
