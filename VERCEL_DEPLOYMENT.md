# SENZ: optional future Vercel deployment

**The verified publisher is GitHub Pages from `masinlocandher-max/Senz`, branch `main`, repository root. See `DEPLOYMENT.md`. No Vercel migration is required to make this repository canonical.**

This file is not evidence that Vercel currently serves either SENZ domain. Do not create a second production project, move domains, or reconfigure an unrelated FMB project solely because this repository contains `vercel.json`.

## Requirements for a separately approved migration

Use `masinlocandher-max/Senz` as the Git source, never `FMB-Ecosystem/apps/senz`. Inspect the current project's Git connection, domain assignments, build settings, and rollback target before any change.

Preserve all existing public pages, assets, URLs, form behavior, and the canonical host `www.senzpr.com`. Test a preview before moving traffic. The current standalone Node server must be deliberately adapted and tested for any serverless runtime; an empty build command or the Other framework preset does not by itself make that server operational.

The current inquiry implementation is email-only. Do not provision a database or add Supabase service-role credentials merely to follow old deployment notes. Any required server-side configuration belongs in the destination provider's settings, not in Git, static output, or chat.

Before a production cutover, verify the exact Senz commit, static routes, API routes where applicable, inquiry delivery, allowed origins, HTTPS, redirects, and rollback. Keep the GitHub Pages publisher unchanged until the replacement is proven and the migration is authorized.
