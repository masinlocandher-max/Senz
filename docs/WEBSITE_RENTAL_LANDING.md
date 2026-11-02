# Website rental landing page — 2 November 2026

The homepage now takes visitors to the complete canonical `/legit-official-site/` landing page before the optional setup questionnaire. The shared Website rental menu continues to use the same page. There is no second SEO copy or infrastructure change.

## Customer journey and source boundaries

The page explains rental for freelancers and startups, while retaining personal, professional, business and organization configurations. Visitors can read the rental explanation, explore illustrative sites, see the current one-page configuration and supported customization, understand quote components and the delivery process, inspect responsibilities and FAQs, then find a setup or request a quote directly.

`components/website-rental.json` owns the editorial sections, quote checklist and FAQ copy. `scripts/rental-presentation.mjs` renders those sections. Its inclusion list reads `commercial/catalog.json` directly; it does not create a competing capability catalog or price source. The existing questionnaire and consented inquiry handler are retained. The reconstructed brief now explicitly requests rental availability, setup/recurring fees, support, updates, rights, renewal and cancellation terms.

Current scope is one page. Custom-domain connection, automatic subdomains, multi-page editing, blogs, arbitrary plugins and online ordering/payments are not presented as included. Other SENZ tools require their own readiness and agreed scope. No rental prices, instant checkout, guaranteed launch dates, unlimited support, unrestricted hosting or broad ownership transfers are advertised. The acquisition/rental hostname is not printed. Domain preferences are requests for feasibility review, not reservations.

The prior launch report [LEGIT_OFFICIAL_SITE.md](LEGIT_OFFICIAL_SITE.md) is historical. Current commercial and technical authority follows [the ecosystem contract](architecture/ECOSYSTEM.md), including quote-only offers and unreleased application gates.

## Visual specification and evidence

Concept references: [rental details](evidence/rental-concept-details.webp) and [costs and questions](evidence/rental-concept-terms.webp). These cover the new sections; the existing hero, native device examples, social-channel story, selector and SENZ shell retain their established design.

Tokens: white `#ffffff`, pale ice `#f3f7ff`, navy `#010522`, cobalt `#003df9`, the existing muted text token and local Inter. Main headings retain responsive 30–49px sizing; body text is 15–18px; control labels are explicit 13–16px. Content uses the existing 1280px maximum width, 96px desktop / 64px mobile section spacing, open two-column bands and numbered rows. Pills use a 999px radius, soft elevation and at least 48px height in normal flow. FAQs use native details/summary with 16px corners and 18px outline chevrons. No new runtime imagery, font service, animation or dependency is required.

Native cloud-browser inspection covered a 1363 × 936 desktop viewport and a 390px-wide, 900px-high mobile iframe. The browser does not expose a viewport setter, so exact 1536px concept dimensions were not available there. The repository browser suite additionally checks the product at 320, 390, 768 and 1440px. The temporary iframe review page is removed before publication.

| Comparison | Concept / render evidence | Resolution |
| --- | --- | --- |
| Layout and hierarchy | Details concept / [desktop rental](evidence/rental-desktop.webp) | Matched the pale band, prominent explanation, raised CTA and open audience rows; reused site gutters. |
| Features and customization | Details concept / [inclusions](evidence/rental-inclusions.webp) | Matched numbered rows and pale customization rail. Inclusion wording intentionally comes verbatim from the authoritative catalog. |
| Palette and typography | Both concepts / desktop sections | White and pale ice remain distinct; local Inter, navy and cobalt match SENZ. Existing responsive scale and muted token are preserved. |
| Costs and action | Terms concept / [quote section](evidence/rental-terms.webp) | Matched four open cost/responsibility rows. CTA intentionally says “Request a rental quote” to distinguish it from the selector’s result action. |
| Ownership and FAQs | Terms concept / [FAQ](evidence/rental-faq.webp) | Replaced the short ownership paragraph with explicit content, domain, design, software, hosting and data rows to fulfill the complete-details request. Added timeline, account-access and audience questions. |
| Icons and cached styles | Terms concept / FAQ and mobile FAQ check | Native browser review caught an oversized chevron with stale CSS. Added intrinsic SVG dimensions and a new stylesheet version; confirmed the final small right-aligned chevrons. |
| Mobile continuation | [Hero](evidence/rental-mobile.webp), [rental explanation](evidence/rental-mobile-details.webp), mobile FAQ | Columns stack naturally; audience rows remain readable, buttons stay in flow, and answers expand without covering adjacent content. |
| Copy and media | Existing hero and native website examples | Original headline, SENZ attribution and hero actions are retained. The added rental paragraph is intentional; no new badges, client logos, testimonials or imagery are introduced. |

The concepts and final browser screenshots are inspected with `view_image` before handoff. The implementation is faithful to the selected section designs with the recorded content/sizing adaptations. The core native-browser path is homepage details link → page-section navigation → mobile FAQ → freelancer goals → Professional site recommendation → prefilled website inquiry. No actual inquiry was submitted to SENZ during manual review.

## Verification record

- Local `npm run check` and 48 unit tests pass. Tests cover all valid selector combinations, tampered handoffs, canonical URLs, capability-source parity, quote-only pricing and the new rental details entry point.
- Local cross-repository check passes against Senzapp `c84d47b32a24f54db82234b4e4026eaf8bae56ae` and acquisition repository `080eb7a7b2a33093a69279ccf958394a2d8b6767`. Public catalog, technical projection, entitlements, pricing and routing agree. Neither source contract was changed.
- Native browser checks confirm desktop/mobile layout, the FAQ expansion, the three-step recommendation and complete prefilled quote brief. Desktop buttons report radius 999px, minimum height 48px and relative positioning; the document has no horizontal overflow.
- The local automated browser run could not start because Chromium was absent and its download returned an invalid archive. The GitHub Website checks workflow runs the full browser regression with a fresh browser; its exact commit result is checked separately before merge.
- Form tests use an isolated delivery receiver. Neither these tests nor the marketing publication establish production inbox receipt, software release readiness or customer activation.

Publication follows the existing GitHub Pages main-branch workflow. Verify its merge SHA and live landing page separately; source and local checks alone are not deployment evidence.
