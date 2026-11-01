# SENZ domain boundary

The configured canonical host is `www.senzpr.com`, as recorded by `CNAME`, `source-of-truth.json` and generated canonical tags. The apex is an alternate entrance. Never reverse this direction based on historical apex instructions.

GitHub Pages is the existing public publisher; the inquiry API uses its separately configured existing backend. The presence of `vercel.json` or `render.yaml` is not evidence that either hosts the public pages.

Inspect the actual provider zone and current targets before any authorized DNS action. This change performs none. Preserve nameservers, MX, SPF, DKIM, DMARC, CAA and unrelated records. `app.senzpr.com` is a planned application origin until deployment is verified. `legitofficialsite.com` and `www.legitofficialsite.com` route only to `https://www.senzpr.com/legit-official-site/`; customer subdomains are outside that redirect.

See DEPLOYMENT.md for publisher evidence and the acquisition repository for exact host-routing tests. Do not copy guessed DNS targets from example configuration.
