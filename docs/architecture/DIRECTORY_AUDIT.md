# Top-level responsibility audit — 2 November 2026

Audit covered tracked files, package scripts/imports, routes, API access checks, schema/migrations, tests, workflows, environment examples, CNAME/canonical tags and deployment references. Original source blobs were checked against upstream GitHub trees before editing. No useful customer tool or infrastructure was deleted. Git history retains original files; historical documents are not current operational instructions.

| Item | Decision | Reason |
| --- | --- | --- |
| `.env.example` | KEEP | Safe names/examples only; Senz removes obsolete private database/admin settings and documents inquiry-only variables. |
| `.github/` | KEEP | Existing CI retained; app adds actual cross-repository validation. |
| `.gitignore` | KEEP | Retained existing source/content; references and tests preserved. |
| `.nojekyll` | KEEP | Existing infrastructure/dependency contract retained; no provider or domain mutation. |
| `404.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `AGENTS.md` | MERGE | Replaced contradictory responsibility/status instructions with one authoritative map and references. |
| `BACKEND.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `BACKEND_AND_ENDPOINT_AUDIT.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `BACKEND_SETUP_INSTRUCTIONS.md` | ARCHIVE | Historical full instructions moved under docs/archive; root compatibility pointer retained. Current host/backend preserved. |
| `BRAND_GUIDE.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `CLIENT_ONBOARDING.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `CNAME` | KEEP | Existing infrastructure/dependency contract retained; no provider or domain mutation. |
| `COMPANY_PROFILE.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `DEPLOYMENT.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `DNS.md` | MERGE | Replaced contradictory responsibility/status instructions with one authoritative map and references. |
| `LICENSE` | KEEP | Retained existing source/content; references and tests preserved. |
| `PRICING.md` | MERGE | Replaced contradictory responsibility/status instructions with one authoritative map and references. |
| `README.md` | MERGE | Replaced contradictory responsibility/status instructions with one authoritative map and references. |
| `ROADMAP.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `SERVICES.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `TEAM.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `VERCEL_DEPLOYMENT.md` | ARCHIVE | Historical full instructions moved under docs/archive; root compatibility pointer retained. Current host/backend preserved. |
| `about.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `agents.js` | KEEP | Retained existing source/content; references and tests preserved. |
| `answers.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `assets/` | KEEP | Existing public brand assets and fonts. |
| `brand-guide.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `brand-strategy-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `careers.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `client-access.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `commercial/` | KEEP | Authoritative public commercial approval, pricing and presentation. |
| `components/` | KEEP | Public presentation and generated catalog consumers. |
| `contact.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `contracts/` | KEEP | Generated reviewed projections; never authoritative copies. |
| `design-rules.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `digital-products.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `docs/` | KEEP | Distinct architecture, commercial, deployment, security and operations references. Superseded duplicates marked historical. |
| `does-small-business-need-website.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `faq.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `function.json` | MERGE | Replaced contradictory responsibility/status instructions with one authoritative map and references. |
| `get-started.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `how-to-build-personal-brand.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `how-to-choose-branding-pr-agency.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `how-to-handle-negative-comments-online.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `index.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `legit-official-site/` | KEEP | Sole canonical public product page and product-specific questionnaire. |
| `llms-full.txt` | KEEP | Retained existing source/content; references and tests preserved. |
| `llms.txt` | KEEP | Retained existing source/content; references and tests preserved. |
| `motion-design-rules.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `music.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `package-lock.json` | KEEP | Existing infrastructure/dependency contract retained; no provider or domain mutation. |
| `package.json` | KEEP | Retained existing source/content; references and tests preserved. |
| `pageant-pr-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `partner-program.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `personal-branding-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `pr-vs-marketing-vs-advertising.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `privacy.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `products/` | KEEP | Generated product explanations; business-website page is now a noindex canonical alias. |
| `public-relations-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `purchase.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `render.yaml` | KEEP | Existing infrastructure/dependency contract retained; no provider or domain mutation. |
| `robots.txt` | KEEP | Retained existing source/content; references and tests preserved. |
| `scripts/` | KEEP | Generation, ownership checks and operational tooling. |
| `server.js` | KEEP | Retained existing source/content; references and tests preserved. |
| `services.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `sitemap.xml` | KEEP | Retained existing source/content; references and tests preserved. |
| `source-of-truth.json` | KEEP | Retained existing source/content; references and tests preserved. |
| `source-rules.md` | KEEP | Retained existing source/content; references and tests preserved. |
| `strategic-communications-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `supabase/` | MOVE | MOVE: schema.sql archived after confirming no runtime/import/deployment references; empty directory is not tracked. |
| `terms.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `test/` | KEEP | Unit/API regression and boundary tests. |
| `vercel.json` | KEEP | Existing infrastructure/dependency contract retained; no provider or domain mutation. |
| `website-strategy-philippines.html` | KEEP | Retained existing source/content; references and tests preserved. |
| `what-is-brand-strategy.html` | KEEP | Retained existing source/content; references and tests preserved. |

No per-customer repository was introduced. No auth, customer database, licenses or private execution was found in the active Senz public runtime; the unused historical Supabase schema was archived rather than copied into a live app migration. Existing app schema and purchased data remain intact. Source files under docs/archive and case-studies are not executable deployment instructions.

Integration note: concurrent SENZ PR #43 (49649eb) was preserved: generated homepage, public catalog previews, navigation and shared controls. The homepage now consumes canonical product URLs and derived release labels. The commercial catalog remains authoritative; no old prices were reintroduced.
