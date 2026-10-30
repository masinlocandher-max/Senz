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

## Rollback

Revert a faulty commit through a normal Git commit and verify the next Pages deployment. Do not move the source back to the monorepo or delete this repository as a rollback shortcut.
