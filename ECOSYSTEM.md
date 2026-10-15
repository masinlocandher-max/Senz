# SENZ ecosystem: one brand, two journeys

**SENZ Strategic Communications and Digital Solutions** · *Influence Through Clarity*

Updated 15 October 2026 on branch `claude/senz-unified-ecosystem`. Nothing here has been merged or deployed.

## Shape

| Channel | Audience | Where it lives | Repository |
|---|---|---|---|
| A. SENZ for Businesses | Organizations hiring SENZ directly | `www.senzpr.com` (static, GitHub Pages via `CNAME`) | `masinlocandher-max/senz` (this repo) |
| B. SENZ Partners | Independent partners building their own firms | Partner app, intended for `partnership.senzpr.com` | `masinlocandher-max/fmbamdcopartnership` |

The two channels share:
- the approved SENZ mark (`assets/senz-original-mark.png`; full lockup `assets/senz-approved.jpeg`);
- one set of colour tokens (Navy `#0A1730`, Blue `#2451D9`, Cyan `#8FD3FF`), defined in `components/senz-site.css` here and `app/globals.css` in the partner app;
- Montserrat 400 to 700;
- one authoritative product catalog, held in the partner app with separate public, partner and admin views.

## Site structure (this repository)

Primary navigation: **Home · Solutions · Work & Demos · Partners · About · Contact**, plus a **Discuss Your Project** button. FAQ, SENZ Answers, Creative Network, Privacy and Terms are in the shared footer.

| Page | Role |
|---|---|
| `index.html` | Proposition, both routes, problems and solutions, proof, process, partner introduction, founder, closing actions |
| `solutions.html` | Seven solution areas, ongoing support, starting benchmarks (`#rates`) |
| `work.html` | Live work, demonstrations on request, SENZ Digital products with real status |
| `partners.html` | Partner opportunity, roles, fulfilment flow, ₱999 membership and disclosure, what partnership is not |
| `about.html` | Why SENZ exists, founder story, working principles |
| `contact.html` | Short inquiry, then optional qualification linked by inquiry ID. `?type=partner` and `?type=demo` presets |
| `faq.html` | Working with SENZ, pricing and process, SENZ Partners, general |
| `privacy.html`, `terms.html` | Updated for the partner program |
| `services.html` → `solutions.html`, `digital-products.html` → `work.html` | Redirect stubs: meta refresh, canonical and `noindex`. GitHub Pages cannot send 301s |

The header and footer are kept identical by `tools/sync-chrome.py`. After changing navigation or footer links, run `python3 tools/sync-chrome.py`. `music.html` is excluded on purpose: it is a separate microsite.

## Commercial model (as implemented)

- **Direct clients:** free Authority Check, then a scoped quotation. Published prices are kept **as existing content pending owner validation**. They are direct-client rates, not partner supplier rates.
- **Partners:**
  - Reseller fulfilment is the default. A direct-contract referral model is separate and switched off unless `REFERRAL_MODEL_ENABLED=true` is set in the partner app.
  - A brief is a request. SENZ commits to supply only after it approves a quoted scope **and** the partner accepts the quotation.
  - Membership costs ₱999, and this sentence is shown before any payment: “₱999 covers partner membership. Product licences, production, and system usage are priced separately.”

## Blockers (cannot be completed from code)

1. **Source of truth conflict.** `README.md` says active development moved to `FMB-Ecosystem/apps/senz`, but recent production commits and the GitHub Pages `CNAME` point here. That monorepo was not accessible in this session. Decide which repository deploys `www.senzpr.com`, then land this branch there.
2. **Partner app domain.** Links use `https://partnership.senzpr.com/`. Its DNS, TLS and hosting were not reachable from this environment and are unverified. The partner app currently runs as a private ChatGPT Sites preview.
3. **Public partner entry.** Because the partner app is private, the public CTAs are **Request Partner Access** (contact form) and **Partner Sign-in**, not a direct link into the builder. Switch them only after a public launch is authorized.
4. **Payments.** Not live. See the partner app's `docs/PAYMENT-HANDOFF-AND-ACCEPTANCE.md` for the exact configuration list.
5. **Contact email.** `info.senz.pr@gmail.com` is still the official address on every page. A domain address would strengthen trust, but none has been provided.

## Decisions for the owner

- Membership duration, support scope, refund policy, seller of record, and the total payable including tax and fees.
- Whether published direct-client prices stay public.
- Which products move to Ready to Sell first. Each needs a verified demo, supplier price, fulfilment rules, a support owner and a white-label decision.
- Whether the referral arrangement should exist at all.
- Whether to keep `music.html` public and linked from Work & Demos.
- Whether the AI-styled photography on older SEO pages (for example `assets/senz-premium-*.png`) should be replaced with real photography. The new core pages use no generated imagery.
- Remove or relocate unrelated files: `brand-guide.md`, `design-rules.md`, `source-rules.md` and `assets/masinloc-*` belong to the Masinloc Archive project.

## Verification performed

- `npm test`: inquiry server tests pass (5/5).
- Link check: every internal link, anchor and sitemap entry resolves. Every page has one `h1` and the shared header.
- Browser checks (Chromium, 390px and 1366px) on 13 pages: no horizontal overflow and no page errors. The mobile menu opens, closes and responds to Escape. The header holds one row at 320, 390 and 768px.
- Contact flow end to end against the real `server.js` validation with a local mock email endpoint: the partner preset applies, empty submissions are rejected, the inquiry is delivered, and the follow-up details are delivered linked to the first inquiry's ID.
- Redirect stubs forward correctly, including `services.html#rates` → `solutions.html#rates`.
- Not verified: live DNS, TLS, FormSubmit delivery to the real inbox, and real-device rendering.
