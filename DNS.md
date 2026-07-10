# SENZ Domain DNS Setup

This repository is configured for the canonical host:

```text
www.senzpr.com
```

## Required DNS records

Create or verify these records at the DNS provider for `senzpr.com`:

| Host | Type | Value | Purpose |
| --- | --- | --- | --- |
| `www` | `CNAME` | your host-provided target, such as the GitHub Pages host or Render target | Serves `https://www.senzpr.com` |
| `@` | `A`, `ALIAS`, or `ANAME` | your host-provided apex target | Keeps `https://senzpr.com` reachable and redirectable |

Do not point `www` at the bare `senzpr.com` apex record. Point both records at the website host so DNS can resolve before the application-level canonical redirect runs.

If the site is published with GitHub Pages, use GitHub Pages' current documented apex records for `@` and a `CNAME` from `www` to the GitHub Pages host. If the site is published with Render, add both `senzpr.com` and `www.senzpr.com` as custom domains in Render and copy Render's exact DNS targets into these records.

## Canonical URL behavior

The checked-in `CNAME` file uses `www.senzpr.com`, and the Node server redirects `senzpr.com` requests to `www.senzpr.com` so both versions resolve to the same public website.
