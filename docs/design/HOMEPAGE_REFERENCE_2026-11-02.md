# SENZ homepage reference implementation

The user supplied a white/navy editorial SENZ homepage and requested a stronger implementation with the correct logo.

## Visual specification

- Retain the official `assets/senz-original-mark.png` unchanged. Following the owner's color revision, use the canonical BRAND_GUIDE.md palette: navy #010522, cobalt #003DF9, ice #EDF3FF, steel #66738B, and white. Light surfaces use ice/cobalt tints; smaller body copy uses darker steel shades for contrast. Navy app band, cobalt partnership band, architectural closing image.
- Georgia editorial headings, locally hosted Inter body and controls. Desktop heading 48–94px; phone 38–64px. Body 15–17px. Outline 24-unit icons at 1.5 stroke. Raised pill buttons in normal flow, without overlaying content.
- Hero copy after the owner’s positioning revision: “Technology / Strategic communications”; “Influence through clarity.”; “SENZ is a technology and strategic communications company. We connect your message, your digital presence and the people you want to reach.”; “Get started”; “Explore our solutions”. Keep the existing shared navigation and exact logo.
- Sequence: hero/connection/audience → website rental → human leadership/strategy → digital solutions → app workspace → partnership → four-step engagement → starting-point cards. Rental stays the second main section.
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
| Hero copy | Influence through clarity; message connected to useful tools | Original headline retained. Owner’s later instruction makes technology, communication strategy and human leadership explicit. Code-native text, two visible CTAs, founder portrait link. |
| Typography | Large navy editorial serif with clean interface text | Georgia headings with local Inter body/controls; phone headline wraps without clipping. |
| Palette | Initial white/navy reference; subsequent owner instruction requests stronger use of the SENZ palette | Ice-blue hero and product surfaces, cobalt audience/partnership bands, canonical navy app/footer, cobalt actions and icons. White is reserved for cards and contrast. |
| Imagery | Devices, sample sites, product views, architectural closing | Hero based on existing CRM/Booking screens; exact mobile app screen; fictional site directions and catalog imagery labeled as previews. No photograph overlay on hero. |
| Buttons/icons | Raised rounded controls; consistent outline icons | Controls remain in document flow; 24-unit outline SVG family, no emoji. |
| Customer journey | Rental then products, app, partnership, process, choice | All present, with a human leadership section between rental and products. Complete catalog preserved in a native disclosure. Style cards select the corresponding supported website example. |
| Accessibility | Readable, predictable controls | Fixed three low-contrast partnership numbers and removed overriding template-card labels that failed visible-label matching. Native menu/Escape, disclosure and Get Started path verified. |

Material visual corrections: correct emblem, navy footer, consistent wordmark spacing, distinct catalog sample objects, visible disclosure chevron, darker partnership numbering, and matching website-example destinations. Remaining differences from the reference are intentional: more whitespace/readable text, simpler static cards, existing navigation, real app evidence, no unsupported trust/security claims, and accurate unreleased/quote-only notices.

The completed rental landing page from main is integrated, preserving its configuration, quote terms and inquiry handoff. Local source/catalog checks and all 48 unit/integration tests passed after integration. Cross-repository capability/commercial/routing validation passed using the reviewed sibling projections. Native browser checks reached the discovery screen and the existing-client support entrance; the Business style card selected its corresponding example. No real inquiry was submitted. Local automated Chromium could not start. Hosted run 41368506209 passed source/unit/generated-output checks, then identified the contrast and visible-label issues above; fixes require a fresh hosted browser run before merge. Final CI and production status are recorded in the pull request, not inferred from local screenshots. Asset revision v2 refreshes the corrected footer, preview labels and example selector.

Generated asset provenance: built-in Image Gen. `assets/senz-connected-workspace.webp`: sunlit stone desk, laptop with supplied SENZ CRM sample screen, phone with supplied Booking sample screen, original emblem as reference, no added promotional text. `assets/senz-catalog-sample.webp`: fictional four-object studio catalog (ivory vase, linen throw, walnut bowl, fluted glass), no text or prices. Both are illustrative, not client premises or merchandise.

## Owner color revision — November 2, 2026

Request: add design elements, reduce pure-white areas, and follow the brand palette. The revision uses an angled cobalt plane behind the hero photograph, fine diagonal rules in the partnership section, ice-blue backgrounds, cobalt audience and partnership bands, and raised pale cards. Native headings, original logo, photography and product content remain intact. The hero photograph is not tinted. Decorative pseudo-elements have no pointer interactions or accessibility content. No new images, dependencies, animation or functionality are introduced.

The native desktop and 390px reviews show readable labels, visible calls to action, clear section separation and no horizontal overflow. Source checks, 48 tests, deterministic generation and the cross-repository contract check pass. Hosted accessibility/browser results and live deployment evidence are recorded in the color-revision pull request.

## Owner human-led positioning revision — November 2, 2026

Request: present SENZ as both a technology company and a communications strategist, with a human behind the digital business. The opening identifies both disciplines explicitly and links to the people behind the work. A new navy section, “Human insight. Digital capability.”, pairs the existing approved founder portrait and name with two concrete practices: communication strategy and digital development. The portrait links to the existing founder biography. No invented team members, quotations or credentials are added.

The new section uses the existing cobalt, navy and ice palette, editorial typography and geometric accents. Website rental remains the second main section. Product availability and application release notices remain unchanged. The engagement steps explain human review and agreed scope. The About introduction, company profile, brand positioning and homepage metadata use the same description.

Local source/catalog checks, all 48 tests and the cross-repository contract check pass. Native browser review confirms the founder link reaches the named biography and the homepage human-led anchor works. Desktop and mobile layout checks inspect the new content, readable contrast and horizontal overflow. Hosted browser/accessibility checks and production deployment evidence are recorded in this revision’s pull request.
