# PURPOSE

This repository owns the public SENZ website.

SENZ sells it. SENZ App delivers it. Legit Official Site brings the right customer to it.

FMB&CO → SENZ Strategic Communications & Digital Solutions → SENZ products and services. Legit Official Site is a digital solution by SENZ, not a separate company.

## WHAT THIS REPOSITORY OWNS

Brand, public pages, public product copy, commercial approval, approved pricing, questionnaires, consented inquiries, SEO and client-access promotion.

## WHAT THIS REPOSITORY DOES NOT OWN

Application product execution belongs to Senzapp. No customer authentication, passwords, private workspaces, licenses, seats, payment verification, private billing, drafts or customer production secrets.

## CANONICAL DOMAIN

https://www.senzpr.com (apex redirects to www); /legit-official-site/ is the sole canonical product page.

## RELATED REPOSITORIES

| Repository | Role |
| --- | --- |
| [Senz](https://github.com/masinlocandher-max/Senz) | Sell and explain |
| [Senzapp](https://github.com/masinlocandher-max/Senzapp) (private) | Deliver and operate |
| [LegitOfficialSite](https://github.com/masinlocandher-max/LegitOfficialSite) | Acquire and route |

## SOURCE-OF-TRUTH RULES

commercial/catalog.json owns commercial offers and price approval. contracts/technical.snapshot.json is generated from Senzapp; it cannot authorize a technical release. components/product-catalog.json and product pages are generated views.

## DEPLOYMENT STATUS

GitHub Pages is the existing public publisher. The separate inquiry API configuration is preserved. Read docs/operations/ECOSYSTEM_VERIFICATION.md for observed status; local or CI success does not prove inbox receipt.

## Development and reference

Run `npm run check` and `npm test`. [Top-level inventory](docs/architecture/DIRECTORY_AUDIT.md) explains every retained, moved or archived item. [Verification](docs/operations/ECOSYSTEM_VERIFICATION.md) distinguishes source, local tests, CI and live evidence.

Use Node 22 for the build and checks. `npm run build:products` regenerates the catalog and public pages. `npm run test:browser` exercises public navigation, forms, discovery, mobile and accessibility against a local delivery receiver.

Read [ecosystem architecture](docs/architecture/ECOSYSTEM.md), [commercial release rules](docs/COMMERCIAL_READINESS.md), [pricing audit](docs/commercial/PRICING_AUDIT.md), [deployment](DEPLOYMENT.md), [brand guide](BRAND_GUIDE.md), and [company profile](COMPANY_PROFILE.md).

The public client path stays on the existing-client support page until the application release evidence is recorded. Never advertise an unverified login destination as live.
