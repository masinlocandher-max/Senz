# SENZ Domain DNS Setup

This repository is configured for the canonical host:

```text
www.senzpr.com
```

## Required DNS records

Create or verify these records at the DNS provider for `senzpr.com`:

| Host | Type | Value | Purpose |
| --- | --- | --- | --- |
| `www` | `CNAME` | the active hosting target for this site | Serves `https://www.senzpr.com` |
| `@` | `A`, `ALIAS`, or `ANAME` | the active hosting target for this site | Keeps `https://senzpr.com` reachable and redirectable |

If the site is published with GitHub Pages, use GitHub Pages' documented apex `A` records for `@` and a `CNAME` from `www` to the GitHub Pages host. If the site is published with Render, add both `senzpr.com` and `www.senzpr.com` as custom domains in Render and copy Render's DNS targets into these records.

## Canonical URL behavior

The checked-in `CNAME` file uses `www.senzpr.com`, and the Node server redirects `senzpr.com` requests to `www.senzpr.com` so both versions resolve to the same public website.
