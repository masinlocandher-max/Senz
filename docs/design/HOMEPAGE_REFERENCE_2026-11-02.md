# SENZ homepage reference implementation

The user supplied a white/navy editorial SENZ homepage and requested a stronger implementation with the correct logo.

## Visual specification

- Retain the official `assets/senz-original-mark.png` unchanged. White page, navy #091d36 headlines, blue #003df9 accent, secondary #526078, pale blue-gray rental band, navy app band, warm neutral partnership band, architectural closing image.
- Georgia editorial headings, locally hosted Inter body and controls. Desktop heading 48–94px; phone 38–64px. Body 15–17px. Outline 24-unit icons at 1.5 stroke. Raised pill buttons in normal flow, without overlaying content.
- Hero copy: “Strategic communications / Digital solutions”; “Influence through clarity.”; “We shape what people understand about you—and build the websites and tools that help them act.”; “Get started”; “Explore our solutions”. Keep the existing shared navigation and exact logo.
- Sequence: hero/connection/audience → website rental → digital solutions → app workspace → partnership → four-step engagement → starting-point cards. Rental stays the second main section.
- Hero is a new product photograph based on existing screenshots, without a color overlay; label illustrative staging/sample data. App section uses an exact screenshot. Website previews are native HTML compositions of fictional design directions, not claims of ready deployable templates.
- Four featured products use catalog-owned links and statuses. Preserve all catalog entries in an accessible disclosure. No catalog, prices, release flags or entitlement contracts changed.
- Existing-client path uses client-access.html. No fabricated released login or install link. No unsupported “trusted by”, security certification, immediate checkout or automatic activation claims.
- Mobile: content-first hero, responsive audience grid, stacking previews/products, vertical process. No autoplay or mandatory carousel. Existing accessible in-flow navigation and reduced motion behavior retained. Animate only noninteractive images/headings.

## Intentional improvements

Correct emblem, more whitespace, readable body copy, actual app evidence, honest availability notices, static preview cards with reliable links, and a focused homepage with access to the complete catalog.

## Verification ledger

The native browser was used for visual and interaction review. A temporary iframe harness supplied 320px, 390px and 640px rendering because this browser API does not expose viewport resizing; the harness is removed from the deliverable. All three widths had equal document/client width, with no horizontal overflow. A full desktop capture was made at 1348px. The supplied reference and final screenshot were opened together for comparison. The supplied reference is 640px wide; the implementation preserves its desktop art direction and deliberately reflows at small widths instead of shrinking desktop text.

| Comparison | Reference / intended result | Implementation and repair |
| --- | --- | --- |
| Identity | The user explicitly rejects the reference logo | Original blue emblem retained byte-for-byte; no generated replacement. Header/footer wordmark spacing made consistent. |
| Hero copy | Influence through clarity; message connected to useful tools | Headline and body match; code-native text, two visible CTAs. Above-fold copy review finds only intentional preview attribution and existing navigation differences. |
| Typography | Large navy editorial serif with clean interface text | Georgia headings with local Inter body/controls; phone headline wraps without clipping. |
| Palette | White, blue-gray rental, navy app, warm partnership, navy closing/footer | Matched section rhythm. First review found a pale inherited footer; corrected to navy with high-contrast links. |
| Imagery | Devices, sample sites, product views, architectural closing | Hero based on existing CRM/Booking screens; exact mobile app screen; fictional site directions and catalog imagery labeled as previews. No photograph overlay on hero. |
| Buttons/icons | Raised rounded controls; consistent outline icons | Controls remain in document flow; 24-unit outline SVG family, no emoji. |
| Customer journey | Rental then products, app, partnership, process, choice | All present. Complete catalog preserved in a native disclosure. Style cards select the corresponding supported website example. |
| Accessibility | Readable, predictable controls | Fixed three low-contrast partnership numbers and removed overriding template-card labels that failed visible-label matching. Native menu/Escape, disclosure and Get Started path verified. |

Material visual corrections: correct emblem, navy footer, consistent wordmark spacing, distinct catalog sample objects, visible disclosure chevron, darker partnership numbering, and matching website-example destinations. Remaining differences from the reference are intentional: more whitespace/readable text, simpler static cards, existing navigation, real app evidence, no unsupported trust/security claims, and accurate unreleased/quote-only notices.

The completed rental landing page from main is integrated, preserving its configuration, quote terms and inquiry handoff. Local source/catalog checks and all 48 unit/integration tests passed after integration. Cross-repository capability/commercial/routing validation passed using the reviewed sibling projections. Native browser checks reached the discovery screen and the existing-client support entrance; the Business style card selected its corresponding example. No real inquiry was submitted. Local automated Chromium could not start. Hosted run 41368506209 passed source/unit/generated-output checks, then identified the contrast and visible-label issues above; fixes require a fresh hosted browser run before merge. Final CI and production status are recorded in the pull request, not inferred from local screenshots. Asset revision v2 refreshes the corrected footer, preview labels and example selector.

Generated asset provenance: built-in Image Gen. `assets/senz-connected-workspace.webp`: sunlit stone desk, laptop with supplied SENZ CRM sample screen, phone with supplied Booking sample screen, original emblem as reference, no added promotional text. `assets/senz-catalog-sample.webp`: fictional four-object studio catalog (ivory vase, linen throw, walnut bowl, fluted glass), no text or prices. Both are illustrative, not client premises or merchandise.
