# SENZ website ↔ app integration contract (v1)

## Source ownership and deployment boundary

- `masinlocandher-max/Senz`: public website, discovery, recommendations, consented inquiries and quotation intake.
- `masinlocandher-max/Senzapp`: private application, eight products, identity, billing records, entitlements, institutional seats and execution.
- The website is `www.senzpr.com`. `app.senzpr.com` is a planned app address, not evidence of deployment.
- No other repository is an input or deployment target for this project.
- Keep independent CI, credentials, staging and production. Do not merge a website PR into its production branch without deployment authorization.

## Descriptive product catalog

The eight product IDs and descriptions originate in private app `src/catalog.js`. Run `node scripts/export-public-catalog.js` in the app and transfer only that JSON output to website `components/product-catalog.json`. Never transfer the private implementation. Review both repository changes together. The export includes no credentials, customer records, billing information, or entitlement logic.

Schema version 1: `sourceRepository`, `releaseState`, `checkoutEnabled`, `products[]` with `id`, `name`, `summary`, `usesAi`, `mode`, `publicStatus`, `nextAction`. This checked-in export intentionally remains `not_released` with checkout disabled. A local beta status in the app is not permission to mark the public product available. Release approval must reference verified hosting, live integrations, customer journeys, approved pricing and terms.

Products: ai-workspace, communications-intelligence, digital-assistant, fotolab, client-portal, event-systems, digital-representative, music-platform. FotoLab, Client Portal, Event Systems and Music Platform are digital workflows, not AI generation products.

## Discovery → inquiry

The website's deterministic `components/discovery-engine.js` is shared by the browser and the website intake backend. It does not call AI. `POST /api/inquiries` with `formType=discovery` accepts the defined answers, rules version, contact details, explicit inquiry consent, honeypot and timing fields. The backend validates and recomputes the recommendation, ignoring client prices, tiers, claimed access or package overrides. Unknown or incomplete route values are rejected.

Consent is for responding to the inquiry, not a marketing subscription. No sensitive documents are requested. The browser keeps answers in memory; they are sent only when the visitor submits. The intake service does not expose or persist inquiries publicly. It sends the validated brief through the existing configured email delivery service. A provider acknowledgement is not proof of final inbox delivery. Live delivery must be verified before release. Release the compatible backend before the website discovery flow.

Staff review process: use the submission reference as the inquiry key in the authorized SENZ inbox; mark New → Reviewing → Quote sent → Accepted / Declined. Confirm scope and approved pricing in the reply. An accepted quote is not an entitlement. Commercial app staff separately verify actual payment or authorized signed contract and grant the purchased scope in the private app. No public intake endpoint can grant access. Do not forward private customer data into public issues or repository files.

## Readiness-aware conversion

Before release, actions are Request a Quote, Request a Demonstration or Institutional Inquiry. There is no functioning automated checkout in the current eight-product app; do not add a purchase button implying otherwise. The manual, auditable verification flow is the commercial activation method. Additional seats/usage require a separately verified license grant. Renewals require a new verified reference.

After an approved product release, app deep links may use `/signup?next=%2Fplans%3Fplan%3Dindividual`, professional, business or institution. Contract products use `/signup?next=%2Fplans%3Fproposal%3D<product-id>`. These URLs select a request only and never activate access. Do not pass prices, rights, payment status, customer answers or tokens in links. Server-side permissions remain authoritative.

## Measurement

Website events: discovery_started, discovery_completed, recommendation_viewed, quote_requested, institutional_inquiry. They are emitted only with explicit optional session consent and contain only the event name and rules version. No analytics provider is enabled by this change. A successful inquiry is not a verified purchase. Purchase/activation measurements must be derived from audited app records, not browser redirects or buttons.

## Release blockers

Production changes and paid provider calls require owner authorization. No live provider key, approved AI budget, deployment, real inbox delivery, off-site backup destination, commercial prices, or live AI output was verified in this work. Test-provider outputs and local delivery stubs must never be shown as production evidence.
