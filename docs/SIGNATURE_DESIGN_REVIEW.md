> Current authority: commercial/catalog.json in Senz and src/catalog.js in Senzapp. Historical price/release statements below do not authorize current offers. Follow docs/architecture/ECOSYSTEM.md and docs/COMMERCIAL_READINESS.md.

# SENZ signature design and client access review

1 November 2026. This is the design and source verification record; production publication is verified separately after merge.

## Intent and implemented experience

Use SENZ’s original mark with the proposed 2026 brand system: Inter, navy #010522, cobalt #003DF9, true white and ice #EDF3FF. The homepage moves from the brand promise to the connection between strategy, digital presence and SENZ App, then a product promotion and an unmistakable returning-client entrance. People imagery is welcoming and inclusive; the illustrative scene is not presented as an actual SENZ team or customer.

The promotion is “Your business, within reach” and “Start with one tool. Grow at your pace.” Published product prices and the existing cost planner support value positioning. No invented discount, comparative savings claim, customer metric or unverified download is introduced. All 13 product names, rates and release conditions retain the shared contract.

## Concept and browser comparison

Concept images were generated before implementation. Source filenames in the design session:

- Hero: `exec-601bed0e-c070-44bb-a5e7-58b0062c0f3b.png`.
- Strategy / digital presence / app connection: `exec-60ec9814-3f86-4dd9-8ca8-8690f60eedac.png`.
- App promotion / returning-client section: `exec-413a1e5b-1c0c-4911-b6a2-63f329bfe4be.png`.
- Companion app sign-in: `exec-70994192-d955-4869-af93-c469c90c672d.png`.

The native implementation was checked through the built-in Chrome browser. The full-page render `senz-signature-desktop-review-20261101.jpg` and the companion app render `senz-app-signin-review-20261101.jpg` were compared directly with the relevant concepts using image inspection in the same QA pass. Browser viewport was approximately 1363 × 936; the generated concepts are 1536 × 1024. Exact native-size viewport control was unavailable, so composition was reviewed at the current viewport and in local 320/390/768px iframe viewports. The QA harness and injected checker were removed before release.

| Comparison | Concept → implementation | Review / correction |
| --- | --- | --- |
| Brand and palette | Navy architectural opening, cobalt actions, white navigation, original mark | Matched the brand board; self-hosted Inter with its license. |
| First viewport | Large “Influence through clarity.”, two actions, immediate returning-client ribbon | Native copy and links; no text embedded in the artwork. |
| Connection | Numbered strategy, digital presence and SENZ App rows with people photograph | Preserved the editorial structure; inclusive standalone image with an illustrative-scene caption. |
| Product promotion | Dark app section with phone and desktop previews | Uses real repository product screenshots and working preview tabs instead of generated dashboard claims. |
| Client paths | Bold cobalt section with workspace, submitted-request and install routes | Three actual anchor destinations, release-aware support links and device instructions. |
| Typography and controls | Inter hierarchy, restrained borders, broad whitespace | Explicit control sizing and touch targets; small-screen headlines and menu checked. |
| Contrast | Light secondary text on navy | Corrected an inherited low-contrast app-preview footer rule. Rechecked with axe. |
| Mobile navigation | Compact brand and obvious client route | Get Started moves into the expanded menu. Menu open/close, follow-up route and installation details checked. |
| App entrance | Architecture on the left, readable form and assistance on the right | Kept the original shared app header; removed the pre-existing literal “null” label and restored an accessible mobile brand link. |

The implementation was visually verified against the concept direction. No unresolved clipping, horizontal overflow, missing primary imagery or nonfunctional visible navigation was observed in the checked views.

## Above-the-fold copy audit and intentional deviations

The homepage opening uses only the planned identity, navigation, “Influence through clarity.”, “Communication that earns trust. Digital tools that move business forward.”, “Find your solution”, “Explore SENZ App”, and the returning-client ribbon. There is no added technology label, fabricated proof statistic or decorative badge.

Intentional functional/accuracy adjustments from image concepts:

- Retain the existing brand descriptor and FMB&CO attribution and original logo rather than a generated mark.
- Replace generated app screens with actual product previews; preserve the preview’s sample-data label and accessible controls.
- Add brief release/activation wording and practical installation support because public app access is not open. The homepage does not link to an unverified app host.
- Use the real SENZ support email in the app, retain account creation and entitlement guidance, and explain invitation setup as text rather than an imaginary email-opening link.
- Keep the real shared app navigation and existing form controls. No generated password-visibility control or example credentials are presented as implemented features.
- Apply mobile image shading and crops to retain readable text in narrow viewports.

## Verification and scope

- Website `npm run check` passed; `npm test`: **38/38 passed**; product regeneration passed. Shared product contract and published prices are unchanged.
- Browser: homepage app-preview switch, mobile menu, client entry, follow-up prefill, and installation disclosures checked. No horizontal overflow in checked 320/390px website views.
- Axe: no reported violations on the final checked homepage/client-entry/contact views. Full repository browser workflow provides the broader page audit.
- Companion app `npm run check`: 123 files plus secret scan; `npm test`: **246/246 passed**. Install prompt availability, consumption, dismissal, failure, acceptance versus completion, manifest/icon serving, protected APIs and safe return paths are covered.
- Companion app browser: desktop login/install views and 320px install guide checked; no overflow. Desktop axe returned no violations. A mobile iframe accessibility scan did not complete and is not represented as a pass.
- No real customer inquiry, payment, credential entry or provider spending was used for these checks. Mocked inquiry tests are not evidence of live email delivery.

## Release boundary

Website publishing remains GitHub Pages from this repository’s main/root. The private app source is separate. `function.json.app.released` stays false in both repositories. Production app deployment, persistent storage, backups/restore, legal approval, applicable provider credentials/budget and full live activation remain required before advertising a working download. Device installation must be checked on the final HTTPS host; a local HTTP preview cannot prove a native installation prompt.

## Follow-up form completion

The live review found that the first client-support prefill still exposed the prospect form’s budget and timing questions. Returning-client links now open a short support variant: name, email, optional organization, message and privacy consent. The sales qualification fields and sales-only copy are removed from this route; normal project inquiries keep their existing form. A hidden support category survives form reset. Confirmation describes accepted delivery and an email reply rather than a commercial-fit review. The browser journey now sends a fixture support request without budget/timing and verifies its category and confirmation.


## Sitewide consistency and motion — 1 November 2026

This polish extends the existing approved signature system; it does not introduce a new visual concept. Inter, navy #010522, cobalt #003DF9, white, the original SENZ mark, architectural imagery and welcoming people imagery remain the references. Inner-page heading weights, gutters, image corners, panels, input fields and action geometry now use those same tokens. Legacy styles load before the signature layer, including styles injected by the older editorial-page script.

Action arrows and close controls use one 20px/1.7-stroke SVG family, hidden from assistive technology while labels remain readable. FAQ and installation disclosures use matching line chevrons. The build normalizes editorial and generated controls together, so regeneration preserves the icon treatment. Font icons and decorative emoji are prohibited in controls.

Native scrolling is preserved. A cobalt progress rule shows page position; visible content groups enter once over 650ms. The homepage connection rules draw as the visitor reaches strategy, digital presence and SENZ App. The existing people image settles into its full frame. There is no scroll interception, forced section snapping or repeating animation. Keyboard focus cancels an entrance, reduced-motion preferences disable movement, and content remains visible without JavaScript. The new homepage discovery link goes to the real solutions section.

Review points: unchanged brand copy and navigation; existing image crops and palette; lighter shared inner-page heading weight; 3px media and control corners; consistent 20px directional icons; native scroll and keyboard behavior. The discovery link is the sole intentional new hero copy.

Validation: source/catalog checks and 38 unit tests pass locally. Hosted browser checks cover every page at 320/390/1440px, internal destinations and anchors, label/icon consistency, shared shell tokens, menu states, inquiry journeys to a stand-in provider, all questionnaire routes, all FAQ toggles/filters, native disclosures, previews, pricing, consultation close, reduced motion and a no-JavaScript client path. Current hosted results are recorded on the pull request. No customer inquiry is submitted during QA.
