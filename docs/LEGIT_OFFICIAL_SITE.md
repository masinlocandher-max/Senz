# Legit Official Site — 1 November 2026

Legit Official Site is a SENZ managed website product for individuals, professionals, personal brands, businesses, companies and organizations. Its acquisition repository is [LegitOfficialSite](https://github.com/masinlocandher-max/LegitOfficialSite); its public page belongs to this repository at `/legit-official-site/`. The existing apex-to-www canonical host policy is preserved.

## Audit and integration

The implementation started from SENZ main `54f81ff740f96cb559a5cbd438e7c76c1652f2d5`, with GitHub Pages verified as the publisher. It retains the real SENZ logo, Inter font, navy/cobalt palette, navigation, forms and existing routes. It adds entry points on the homepage, services page, website strategy page, catalog, setup guide and shared footer. The existing questionnaire's website path identifies Legit Official Site.

The product configuration, audience/goal/domain choices, recommendation logic and unapproved commercial fields are centralized in `components/legit-official-site.json` and `legit-site-model.js`. `scripts/render-legit-site.mjs` generates the canonical HTML during `npm run build:products`. Existing 13 software prices and app release gates are unchanged. The two function contracts identify the managed service separately from software subscriptions.

The selector recommends the smallest starting configuration; optional booking, catalog management, ordering and content updates require review. Requests transfer only fixed choice identifiers in the URL. The contact form reconstructs an editable brief and uses the existing consent and delivery handler. In this flow, a company name and budget are optional; no price anchor or checkout is introduced.

## Capability boundaries

The existing licensed website engine in Senzapp provides one-page public profiles, text, photos, services, inquiries and publish/unpublish controls. The companion app change adds safe presentation choices, personal/professional/business/company configuration, section priorities, headings and button destinations. Custom-domain routing, tenant subdomain provisioning, online ordering/payments, multipage editing and a blog are not implemented by that engine. The landing page describes these as scope/availability discussions, never instant activations.

The app remains unreleased. Customer access still requires actual deployment readiness and purchased entitlement, verified payment or an authorized agreement. No price, release status, entitlement or payment policy changes here.

No analytics collector was found in the current website. The new page emits non-personal `senz:analytics` events and uses `dataLayer` only if already installed. These are integration hooks, not stored conversion reports. No new tracker, dependency or analytics cookie is introduced.

## Design and visual review

The accepted direction was a white/navy/cobalt editorial page: three-line headline, original botanical still life inside native desktop/phone interfaces, a contrasting channels-to-home visual, website examples, a concise setup guide and a strong closing CTA. The preview was compared with the generated visual concept using local image inspection and a connected browser.

Intentional changes from the concept: retain SENZ's real logo, navigation and Inter section headings; use native HTML/SVG for readable interface storytelling; omit stock social-feed photos, fake statistics and unsupported ownership promises; expose one large interactive example at a time on mobile. The original generated photograph is illustrative artwork, not client work. All fictional identities are labeled.

Visual checks: hierarchy, spacing, contrast and large touch targets pass at 390px and desktop. Automated layout checks cover 320, 390, 768 and 1440px for this page. Reduced motion is supported; the convergence lines use a lightweight progressive enhancement. No horizontal overflow was found. The final hero is recorded in [the browser preview](evidence/legit-official-site-hero.png).

Quality ledger: identity/brand continuity — pass; hero readability — pass; mobile first-screen offer/CTA — pass; real interactions — pass; fictional-demo disclosure — pass; ownership/pricing accuracy — pass; keyboard and automated WCAG checks — pass. Domain activation and live email receipt are deployment/operations checks, not claims established by screenshots.

## Verification

- `npm run check`: passed.
- `npm test`: 43 passed, including all valid audience/goal/domain combinations and invalid handoffs.
- `test/browser/legit-site.cjs`: all five requested perspectives reach the right recommendation and send through the real handler to an isolated email provider. It also verifies empty-goal validation, reload persistence, examples, optional budget/organization, failed-delivery recovery and four-width accessibility.
- Existing full browser regression: passed across 42 pages, 198 internal links and 131 questionnaire paths. Existing 36 consented test inquiries delivered to the isolated provider; controls, no-JavaScript fallbacks and reduced motion passed. The new five-persona flow also passed.
- Native browser review: desktop, 390px layout and the personal-site contact handoff.

The five perspectives are an individual (Personal), freelancer (Professional), Facebook-reliant small business (Business), growing company (Company) and uncertain non-technical visitor (Personal starting point). Each starts without a company registration, software purchase or technical vocabulary requirement.

## Release and remaining activation

Publish through this repository's existing main/GitHub Pages path, then verify the actual URL and matching deployment commit. Local inquiry delivery used an isolated provider and sent no real emails.

The acquisition repository contains a tested 308 redirect for exactly `legitofficialsite.com` and `www.legitofficialsite.com`, preserving bounded UTM parameters. Its destination is `https://senzpr.com/legit-official-site`, which follows the existing canonical www policy. No duplicate marketing page is published. Domain-provider access is still required to attach the redirect and TLS while preserving DNS, MX, TXT and customer subdomains. No DNS or hosting migration was performed.

The repeatable delivery process and domain/rights responsibilities are documented in the acquisition repository's `SERVICE_DELIVERY.md`. Approved fees, service terms and actual customer delivery readiness remain prerequisites to accepting payment or activating a customer site.
