# SENZ repository instructions

## Function

`function.json` is the shared contract with `masinlocandher-max/Senzapp`. This repository is the public website: explain SENZ, show each product's published monthly price, and take a purchase request. It does not sign people in, charge a card, grant a license, or run a product. All fifteen products have published prices, including FotoLab, Music Platform, and the seven business products. Availability requests stay open; paid activation waits for verified production readiness. Do not use the Fox Syli name for them. Do not link to `app.senzpr.com` while `app.released` is false. Do not describe a product as ticketing, voting, tabulation, a clone studio, staff photo retouching, or a public music chart. `music.html` is the Music division showcase, not the Music Platform.

## Source ownership

The owner has designated `masinlocandher-max/Senz` as the canonical, independent source for `www.senzpr.com` and `senzpr.com`. Production branch: `main`. Source directory: repository root.

Make SENZ changes in this repository. `FMB-Ecosystem/apps/senz` is a historical copy, not an upstream source or a production deployment target. Do not migrate SENZ back into that monorepo or replace this site's content with its different public build without explicit owner instruction and a reviewed comparison.

## Preserve the working site

Keep existing pages, assets, forms, URLs, CNAME, and brand content unless the task specifically changes them. Do not delete historical repositories or overwrite newer work. A source-ownership correction is not permission to redesign the site, alter pricing, move domains, or change databases.

## Validation and publishing

Run `npm run check` and `npm test` before merging. `source-of-truth.json` is the source contract; `scripts/check-source.mjs` validates it against package metadata and CNAME. The checker is a validation command, not a server-side GitHub Pages policy.

Read `DEPLOYMENT.md` before touching deployment settings. Confirm the exact repository, branch, commit, publisher, and target domain from deployment evidence. Do not infer the live host from an old README or from the existence of vercel.json. A successful unit test is not proof of live form delivery.

## Security and scope

Keep secrets in their hosting provider, never in Git, generated public files, logs, or chat. Do not print environment variable values. Keep SENZ data and credentials separate from Cognita, FMB News, Jewel, and other applications. Preserve existing approval and access boundaries.

