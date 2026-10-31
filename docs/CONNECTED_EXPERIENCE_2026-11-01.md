# SENZ: a connected, welcoming website

## Positioning

**Clearer communication. Simpler business.** SENZ connects strategic judgment, useful digital experiences, and the tools that help people deliver on their promises. The website leads with customer outcomes and shows the next step visually.

The presentation is corporate, warm, and quietly luxurious: the original SENZ identity, self-hosted Montserrat, navy and white, generous space, restrained blue accents, and editorial scenes of professionals, a café owner, and an inclusive team. The images are illustrative scenes created for this redesign, not client portraits or testimonials. Three optimized WebP assets total approximately 189 KB. Their original generated compositions were reviewed before use.

## Visitor journey

| Surface | Visitor's question | What the page does |
| --- | --- | --- |
| Home | Is SENZ for me? | Shows individual, business, and team paths; explains the connected journey; previews working product screens with sample data. |
| Solutions | How do strategy and digital delivery work together? | Connects message, experience, and response; separates professional engagements from licensed software. |
| SENZ App | What helps with my day-to-day work? | Groups 13 products by customer outcome, with concise descriptions and published monthly prices. |
| Product details | What is included? | Provides a three-step visual workflow, features, limitations, and request availability. |
| Cost planner | What would this cost for my team? | Totals selected products and named users, optionally compared with the visitor's own current monthly spend. |
| Get Started / Contact | Where do I begin? | Preserves the existing questionnaire and inquiry forms; the planner passes selected tools and seats into a clear brief. |

The main navigation is Solutions, SENZ App, About, Contact, and Get Started. The original logo returns home. Guides, FAQ, company resources, privacy, and terms remain in the footer and at their existing URLs.

## Product and claims rules

- The public catalog is exported from `Senzapp/src/catalog.js`. Both `function.json` contracts match. `npm run check:catalog` checks all 13 products for matching names, prices, capabilities, limitations, and release state.
- The customer-facing name is **SENZ Workspace**. Existing product keys and URLs remain compatible. Marketing describes writing, communication, and business operations in plain language.
- Price-based value is demonstrated through a calculator, not an unverified claim to be cheaper than every competitor. The comparison is arithmetic against the visitor's own number, not feature equivalence or guaranteed savings. Setup and custom work are excluded and explained.
- Product previews use sample data. Editorial people images are labelled illustrative. There are no invented customers, testimonials, performance figures, or awards.
- Strategy and tools support a connected customer journey; cross-product integrations are not implied to happen automatically. Integrations are scoped separately.
- Requests are open. Availability, final price, and activation are confirmed before payment. `app.released` remains false; the website does not link to the unreleased application or accept a card payment.

## Design fidelity

| Reference element | Implemented result |
| --- | --- |
| Split hero, clear promise, desktop and phone product presentation | Preserved with authentic repository product screenshots and the official SENZ mark. |
| Three connected steps | Native, accessible HTML representations of a message brief, booking request, and follow-up list. |
| Large product preview | Existing authentic screenshots and functional preview controls; readable links open the full screens. |
| Navy value section | Published entry prices and a working link to the cost planner. |
| Corporate hospitality added in the owner's follow-up | Three warm editorial photographs, inclusive audience paths, and a soft neutral background. |
| Responsive typography and footer | Intentional reflow, stacked photos, accessible mobile navigation, and retained resource links. |

The concept image is a visual direction, not the deliverable UI. Generated interface details were replaced with accurate product visuals; the final page contains selectable text, real links, native controls, and responsive layouts.

## Verification

- Website: `npm run check`, `npm test` — 36 passing tests, including pricing calculations, input bounds, inquiry validation, source ownership, and existing form-server behavior.
- Product export compared structurally with the app's current exporter; both shared contracts compared for exact JSON equality.
- Browser: seven key pages at 320, 390, and 1440 px. No horizontal overflow; no reported WCAG A/AA axe violations after correcting the photograph-caption contrast. Earlier intermediate-width checks also covered 375, 768, and 1024 px.
- Mobile navigation opens, exposes its four links, and closes with Escape.
- Booking questionnaire completes and correctly carries three users and the ₱2,970/month estimate into the request form.
- Planner: QR Menu + Booking for three users totals ₱5,340; comparison with ₱6,000 reports ₱660 less. The contact handoff contains the product names and user count, without sending the visitor's comparison budget.
- Preview controls switch between follow-ups, bookings, and QR Menu; the sample sold-out control changes the menu state.
- No live inquiry was sent during verification. Local delivery tests use a stand-in; they are not proof of live email delivery. No production payment, access grant, or application release was performed.

The existing GitHub Pages publisher, domain settings, Render inquiry backend, and release boundaries are preserved. Concurrent upstream font and 404-page improvements were included before final validation.
