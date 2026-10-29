# SENZ source and publishing

## Canonical source

- Repository: `masinlocandher-max/Senz`
- Production branch: `main`
- Source directory: repository root (`.`)
- Canonical domain in `CNAME`: `www.senzpr.com`
- Additional public domain: `senzpr.com`
- Verified publisher: GitHub Pages

`FMB-Ecosystem/apps/senz` is not the canonical source. Its different build and content must not replace this site's existing pages as part of a source correction.

## Deployment evidence checked on October 16, 2026 (Asia/Manila)

GitHub Actions run [34632415250](https://github.com/masinlocandher-max/Senz/actions/runs/34632415250), `pages build and deployment`, successfully published branch `main` at commit `30d5c5a4fa02fcd85e6b3963fb2479130fa2f3ab` on September 11, 2026 UTC. Its deploy job, `103372252423`, reported success and the environment URL `http://www.senzpr.com/`.

This is evidence of a Pages deployment to the configured custom domain, not an independent audit of every Cloudflare origin or redirect setting. Direct requests from the inspection environment received HTTP 403. The connected Vercel team's listed project did not contain either SENZ domain. No DNS, Cloudflare, or Vercel production setting was changed for this correction.

## Release checks

1. Run `npm run check` and `npm test` on the proposed commit.
2. Review the diff and merge to `main` without rewriting history.
3. Inspect the subsequent GitHub Pages run and verify that its head SHA matches the merged commit and its deploy job succeeds.
4. Verify the public pages and inquiry flow from a normal browser. Do not report live email delivery based only on mocked tests.

The source checker validates committed metadata and, when supplied, GitHub/Vercel repository identity. It does not configure Pages, gate its native publisher automatically, change DNS, or prove that the public edge is serving a specific commit.

## Static website versus optional backend

GitHub Pages publishes static files. It does not run the repository's `server.js` Node HTTP service. Keep the existing frontend behavior intact; an independently hosted Node backend must be verified separately. Tests exercise the email-only backend with test fixtures, not a live customer submission.

The presence of `vercel.json` is not proof of an active Vercel deployment. `VERCEL_DEPLOYMENT.md` is retained only as guidance for a separately approved future migration.

### Where the inquiry forms actually go

The static pages post inquiries to `SENZ_API_BASE_URL` in `components/site-config.js`, currently `https://senz-api-8vt4.onrender.com`. That is the `senz-api` service described in `render.yaml`: this repository's `server.js` on a Render free web service. It relays each inquiry to `SENZ_FORM_DELIVERY_ENDPOINT` (FormSubmit, to `info.senz.pr@gmail.com`) and fails loudly if the relay does not report success, so visitors see the email fallback instead of a false confirmation.

A free Render service sleeps when idle and can take up to a minute to start. The forms therefore wake it when a visitor starts filling one in, wait up to 60 seconds, and say that the request is still sending after 8 seconds. A paid always-on plan removes the wait; that is an owner decision.

None of this is verified live from this repository's tests. Before relying on the forms, the owner confirms and records, with dates:

1. The Render service `senz-api` is deployed from this repository's `main`, and `GET /api/health` on the address above answers.
2. FormSubmit is activated for `info.senz.pr@gmail.com` (FormSubmit holds submissions for a new address until the activation email is confirmed).
3. A real submission from a normal browser on `https://www.senzpr.com`, clearly marked as a test, reaches the inbox, and its reference matches the one shown on the page. Do this once for the contact form and once for the discovery form.
4. `SITE_ORIGIN` on Render lists both public domains, so browsers on either domain are allowed.

The server limits inquiries so a script cannot flood the inbox or use up FormSubmit's allowance: each address may send 10 in ten minutes (`SENZ_INQUIRY_LIMIT_PER_ADDRESS`) and the whole site 60 an hour (`SENZ_INQUIRY_LIMIT_PER_HOUR`). A refused visitor is told to email `info.senz.pr@gmail.com`. Counts are kept in memory, so they reset when the service restarts; that is acceptable for one instance.

`npm run test:browser` (CI job `browser`) completes the discovery questionnaire in a real browser, at phone width, for all seven audiences (individual, professional, business, company, educational institution, government office, and a custom inquiry). It checks that each recommendation states the problem, the SENZ solution, its limits, and the next action, then submits the inquiry through `server.js` to a local stand-in for FormSubmit and checks what SENZ would receive. It sends nothing to the real inbox, so check 3 above is still required.

### Merge order for the website pull requests

#28 is stacked on #27, and GitHub Pages publishes `main` as soon as it changes. Merging #27 into `main` first would publish, until #28 follows, content that #28 removes: FotoLab and Music Platform on 8 and 7 pages, the voting and tabulation claims, the CHED/DepEd claim, "clone studio", and a Music Platform page at `music.html`. To publish once, in the reviewed state:

1. Merge #28 into #27's branch (`fix/website-discovery-alignment-20261027`).
2. Confirm "SENZ Website Checks" (`website` and `browser`) pass on #27's new head.
3. Only with release approval, merge #27 into `main`, and confirm the Pages deployment shows that commit.

## Rollback

Revert a faulty commit through a normal Git commit and verify the next Pages deployment. Do not move the source back to the monorepo or delete this repository as a rollback shortcut.
