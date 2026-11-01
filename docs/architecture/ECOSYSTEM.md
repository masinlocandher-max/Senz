# SENZ ecosystem ownership and release contract

SENZ sells it. SENZ App delivers it. Legit Official Site brings the right customer to it.

## Authority and data location

| Information | Authoritative source | Consumer / boundary |
| --- | --- | --- |
| Technical capabilities, limitations, stage, release evidence | Senzapp `src/catalog.js`; safe exporter `scripts/export-technical-catalog.js` | Generated `Senz/contracts/technical.snapshot.json`; no customer data, secrets or staff notes |
| Public copy, commercial approval, quoted/approved public prices | Senz `commercial/catalog.json`, `commercial/presentation.json` | Generated website catalog/pages and `Senzapp/contracts/commercial.snapshot.json` |
| Runtime access and private commercial records | Senzapp SQLite and private storage | Server-side role, workspace, entitlement, seat, expiry and suspension checks |
| Customer site drafts, content and media | Senzapp persistent storage, workspace scoped | One reusable renderer; public output only when published and actively licensed |
| Acquisition host routing and safe campaign vocabulary | LegitOfficialSite `redirect.mjs`, `campaign-rules.mjs` | Exact apex/www only; never wildcard customer hosts |
| Inquiry contact data | Public inquiry request → existing configured email provider/inbox | No SENZ public database; manual commercial intake, no automatic license |
| Historical imports and old amounts | Archived documentation / app case study and immutable migrations | Internal evidence; never a current offer |

`function.json` files contain repository boundaries and platform release metadata, not competing product arrays. The stable app entitlement for Legit Official Site is `business-website`; its public product ID is `legit-official-site`. Existing licenses and URLs remain compatible. `/products/business-website.html` is a noindex alias pointing to the sole canonical product page and is excluded from the sitemap.

## Synchronization

With sibling checkouts at reviewed revisions:

```bash
node Senz/scripts/sync-ecosystem.mjs Senzapp
npm --prefix Senz run build:products
node Senzapp/scripts/export-public-catalog.js --markdown > Senzapp/docs/PRODUCTS.md
node Senzapp/scripts/check-ecosystem.mjs Senz LegitOfficialSite
```

The command exports the Senz commercial projection first and the app technical projection second. Snapshots record owner, source path and SHA-256 of the serialized data. They are generated transport artifacts, not additional authorities. Hashes detect accidental changes, not signatures or independent attestation. Review both repos; never type a status or price into a generated view. Capability inclusions and limitations must agree exactly with the technical source. Human product prose may clarify the evidence without adding unsupported capability claims.

The app CI checks all three actual checkouts, including public pages, price approval, IDs, entitlement mappings, slugs, source owners, retired products and redirect target/host set. Public CI cannot read the private app: it validates the reviewed safe projection and generated output. A coordinated release must pass the app cross-repository check before merge/public release. Use explicit sibling refs for a coordinated PR; after merge the default main check detects drift. Changes to either public repository also require the app contract workflow to be run against those refs. A scheduled read-only check catches subsequent default-branch drift without new services or credentials.

## Release states

Technical states: concept, development, internal_testing, pilot, beta, production_verified, retired. These are source-controlled evidence states. The existing private database states (in_development, beta, custom, available, suspended, retired) remain operational switches. A pilot does not make a product production verified or publicly purchasable.

Commercial states are separately derived: publicly explained, requestable, purchasable. Every current public product is explained and requestable for feasibility/quote review. None passes the production sellability gate. Requests are not a promise of delivery or acceptance of payment.

Sale requires per-product production evidence/date, functioning infrastructure, verified platform deployment, commercial approval/reference, approved pricing or quote-only terms, delivery process verification and applicable legal/policy approval. Setting `app.released` alone cannot release all products. A frontend card, staff note or migration is not production evidence. Staff cannot set Available without the source technical release record.

## Customer journey and current boundary

Discovery → exact-host campaign redirect → canonical SENZ product page → questionnaire → consented inquiry → staff feasibility/quote → accepted agreement and verified payment/contract → account/workspace → license and seat → SENZ App → edit → private preview → explicit publication confirmation → public reusable site → renew/expand.

The public inquiry handler only forwards accepted email payloads; provider acceptance does not prove inbox receipt. Staff manually reconcile the inquiry, scope, acceptance and verified payment reference. There is no automatic checkout, payment-provider webhook or public-form-to-entitlement bridge. Production operation of this full sequence remains blocked until live evidence is recorded.

Legit Official Site currently has a one-page renderer, bounded content sections, contrast-safe themes, typography, layout, photos, contact links, SEO, a private authenticated preview, and explicit publish/unpublish. Preview does not publish or send inquiries. Updates to an already published page appear immediately: unpublish before private revisions. There is no separate staged revision/approval queue. Automatic subdomains, custom-domain mapping, multi-page/blog/ecommerce, arbitrary plugins/code and unlimited scope are not implemented or promised.

## Domain and operational safety

Preserve existing Pages, inquiry backend and app Blueprint configuration. No DNS/email records changed. No GoDaddy or Railway use. Customer subdomains need separately verified tenant mapping, TLS and isolation; an acquisition redirect cannot provision them. Domain ownership/registrant, fees, renewal responsibility and transfer rules must be agreed before purchase. Unrelated FMB&CO properties are outside this work.
