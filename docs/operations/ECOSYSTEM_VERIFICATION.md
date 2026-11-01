# Ecosystem verification — 2 November 2026 (Asia/Manila)

## 1. Verified completed work

The three upstream main trees were audited and their source blobs checked before editing: Senz `4f423d28fd4554ae8d9fce073f5cd4bbf402d05c`, Senzapp `1f7517cc87b99ffcf72bf2e4e2e44ead533fc6c7`, LegitOfficialSite `17341adcf4ea152da0419358bf24b054b56554f6`.

Implemented separate technical and commercial authorities, generated projections, sellability validation, quote-only pricing, canonical product routing, app entitlement protections, private website previews and a complete local product journey. Existing storage, migrations, purchased entitlements, auth, staff roles and infrastructure were retained. No live customer data was accessed or moved.

## 2. Repository responsibilities

Senz sells and explains. Senzapp delivers and operates. LegitOfficialSite acquires and routes. See [architecture](../architecture/ECOSYSTEM.md) and each README's seven ownership/status sections.

## 3. Files moved, removed and refactored

- Senz's unused `supabase/schema.sql` moved to `docs/archive/supabase/schema.sql` after runtime and deployment reference checks. No database was modified.
- Old backend setup and alternate Vercel guidance moved to `docs/archive/`; root filenames remain compatibility pointers.
- Superseded commercial readiness documents archived as historical evidence. No old amount remains an approved public offer.
- Duplicate product arrays removed from `function.json`; technical facts derive from the app registry and commercial facts from SENZ's catalog.
- `products/business-website.html` became a noindex alias; one canonical `/legit-official-site/` remains.
- Existing private photo/music tools and Fox Syli migration reference preserved internally. New grants/renewals for retired products are blocked.
- No new runtime dependency, platform, per-customer repository, nameserver or DNS record.

Every top-level item is classified in each repository's `docs/architecture/DIRECTORY_AUDIT.md`.

## 4. Product source of truth

| Type | Owner |
| --- | --- |
| Technical status, capabilities and evidence | Senzapp `src/catalog.js` |
| Commercial approval, public copy and pricing | Senz `commercial/catalog.json` / `commercial/presentation.json` |
| Private entitlements, seats, payment references and customer content | Senzapp database/private storage |
| Acquisition routing and approved campaigns | LegitOfficialSite `redirect.mjs` / `campaign-rules.mjs` |

Generated projections include hashes and source paths. Actual cross-checkout validation catches drift, conflicting prices, missing entitlement IDs, duplicate IDs/slugs, unsupported claims, retired public products, missing pages and incorrect redirect hosts/targets. Public CI validates the safe private-app projection; private app CI checks all three sources. This is a coordinated release protocol, not an atomic three-repository deployment.

## 5. Test results

Run commands from the named repository unless paths are shown. The browser harness uses Playwright 1.63.0. Local Chromium was 152.0.7977.30 via `CHROMIUM_EXECUTABLE_PATH` because the pinned browser download was truncated in this workspace; GitHub CI installs Playwright's matching browser.

| Command / scope | Observed local result |
| --- | --- |
| Senz `npm run check` | Source ownership, syntax, catalog and domain checks pass |
| Senz `npm test` | 47 passed |
| Senz browser `pages.cjs`, `mobile.cjs` | 42 pages at 320/390/1440px, 194 internal links, control checks; mobile navigation and axe checks pass |
| Senz browser `journeys.cjs`, `questionnaire.cjs`, `controls.cjs`, `legit-site.cjs` | 134 questionnaire paths; 35 general/product form deliveries to an isolated receiver; five LOS personas; controls, keyboard, provider-failure and responsive checks passed in individual runs |
| Senzapp `npm run check` | Syntax of 136 files, current-source secret scan and local commercial projection pass |
| Senzapp `npm test` | 255 passed, including auth, CSRF, sessions, roles, membership, seat caps, isolation, expiry/suspension, migrations, backups, release gates, private preview and quote-only requests |
| Senzapp `scripts/run-e2e-local.sh` | 73 customer/staff/product screens exercised; final PR CI passed and uploaded browser evidence |
| Senzapp `npm run e2e:mobile` | Login/privacy gate, locked/active/suspended products, API denial; 30 route/viewport checks across six widths passed |
| Senzapp `npm run e2e:website` | Local public request → verified simulated authorization → seat → QR Menu publication passed |
| Senzapp `npm run e2e:legit` | Complete local LOS journey below passed |
| LegitOfficialSite `npm run check && npm test` | 7 passed: apex/www, GET/HEAD, other methods, approved UTM values, unsafe values, exact-host exclusions and malformed URLs |
| `node Senzapp/scripts/check-ecosystem.mjs Senz LegitOfficialSite` | Actual three-repository contract passed |

Full browser commands are `npm run test:browser` in Senz and `scripts/run-e2e-local.sh`, `npm run e2e:mobile`, `npm run e2e:website`, `npm run e2e:legit` in Senzapp. The browser plugin was unavailable; existing repository Playwright harnesses were used. Local tests are not live security certification or deployment evidence.

The LOS rehearsal uses the real acquisition handler in a browser routing fixture (only its target origin is adapted to localhost), the actual public inquiry server and isolated receiver, a private quotation accepted without access, simulated staff payment verification, login, Active product, editing, private preview while anonymous access returns 404, explicit publish confirmation, anonymous rendered website, and suspension returning the public page to 404. Every identity and monetary record is synthetic. It proves source integration only.

## 6. Deployment status

| Environment | Evidence / limit |
| --- | --- |
| Local | Sources and tests above verified; no real provider charges or customer data |
| CI | Architecture PR checks passed: [Senz #44](https://github.com/masinlocandher-max/Senz/pull/44), [Senzapp #18](https://github.com/masinlocandher-max/Senzapp/pull/18), [LegitOfficialSite #1](https://github.com/masinlocandher-max/LegitOfficialSite/pull/1). The app rerun passed against both corrected public main branches. Later changes require their own head-specific checks |
| Staging | Not verified; no connected host/credentials were used |
| Production public SENZ | [Pages deployment](https://github.com/masinlocandher-max/Senz/actions/runs/41337925085) passed for merge `be843c1`. The live catalog showed all 13 products as quote-only/not currently released; a two-seat planner selection remained quote-only. The canonical product page showed “Your website. Your space. Your rules.” and its professional questionnaire reached a correctly prefilled inquiry. No form was sent. A first-click entrance-motion issue found in this live check is addressed by excluding interactive content from entrance movement, with a dedicated browser regression |
| Production inquiry delivery | Not verified; no real inquiry was sent, and inbox receipt was not checked |
| Production acquisition hosts | Apex and www showed upstream connection errors in this browser; no working redirect was observed. This is not proof of the authoritative DNS state or a global outage |
| Production SENZ App | App origin showed an upstream connection error in this browser; no login, data persistence or actual entitlement operation verified |

No deployment account, DNS zone, payment channel, paid AI provider or customer account was changed. Existing deployment configurations remain in place. The recorded Pages evidence applies to `be843c1`; later changes require their own deployment and live checks. The combined public source preserved concurrent homepage/navigation PR #43 rather than overwriting it.

## 7. Remaining blockers

Selection of the existing Render workspace before connector inspection; actual acquisition DNS/edge-provider access; verified app hosting/TLS/persistent storage and restore drill; approved production policies and delivery process; current commercial/price or quote-only approval; confirmed email receipt; verified staff payment reconciliation. AI products additionally need their existing approved provider configuration and a bounded live evaluation. Custom/subdomain automation is not implemented.

## 8. Risks

Separate repository updates are not atomic: use the actual cross-repository check and retain request-only gates until coordinated evidence is complete. A passing catalog hash does not prove production functionality. Public GitHub Pages serves repository content; place only sanitized documentation/projections in Senz. Published customer-site edits are immediate; unpublish for private revisions until a staged revision model is deliberately implemented. Existing app PRs must be rebased and rechecked against these entitlement/contract changes before later merging.

## 9. Next actions

1. Keep coordinated checks passing; verify the first-click follow-up in its Pages deployment and live browser.
2. Identify existing acquisition DNS/edge configuration and app deployment; validate staging, persistence, backup restoration and tenant isolation using synthetic data.
3. Confirm inquiry inbox receipt and the staff quote/payment/activation process.
4. Record approved policies, delivery evidence and per-product production verification, then approve commercial availability. Publish prices only with approval references; quote-only is valid after the remaining gates pass.
5. Introduce customer domain mapping only after its separate DNS/TLS/isolation design is verified.

## 10. Owner decisions required

Approve current commercial terms and whether each product is quote-only; confirm policy/delivery sign-off and authorized staff; identify existing hosting and DNS accounts and any necessary paid capacity. Approve a bounded real AI evaluation only for AI products being released. Select actual campaign labels before adding them to the redirect allowlist. No framework or provider migration is required by this architecture.
