# Deployment: SENZ AI, GitHub source only

**Canonical GitHub source:** `masinlocandher-max/Senz`, `ai-platform/`.
The SENZ public website remains on GitHub Pages, unchanged. The paid application needs a separate HTTPS service to run its Node API. Do not use Replit.

## Deployment target
Use a GitHub-connected container host for a **separate SENZ AI application service**, with build context/root `ai-platform` and `Dockerfile`. A Railway service, Render web service, or equivalent container host can serve both the login UI and Node APIs from the same app hostname. Do not configure the existing SENZ GitHub Pages publication to point to `ai-platform/`.

**Health endpoint:** `GET /api/health`. A 200 response means only the process started; it does not prove that checkout, AI, or the database work.

## Backend dependencies and secret isolation
1. **Create a dedicated SENZ Supabase project**, independent of Masinloc Connect and every other company product. Apply `schema.sql` and check that every public table has RLS enabled, and `anon`/`authenticated` roles have no direct grants to protected data.
2. Enable required Supabase sign-in methods and email verification.
3. Set deployment environment values from `.env.example`. Restrict **service role, PayMongo secret and webhook secret, OpenAI API key** to the **backend only**. Do not commit credentials, secrets or client data.
4. In the account's PayMongo test environment, configure an HTTPS endpoint at `https://<APP_HOST>/api/webhooks/paymongo` subscribed to `checkout_session.payment.paid`. Use the matching test webhook secret.
5. Set `SENZ_PLAN_PRICING_JSON` only to explicitly approved peso prices, for example a JSON map from known plan IDs to peso amounts. Missing prices remain unavailable. Never invent or publish a rate before owner approval.
6. Configure `PUBLIC_APP_URL` as the deployed HTTPS origin (no trailing slash).
7. Connect `OPENAI_API_KEY` and a supported `OPENAI_MODEL`, with vendor-side monthly spending limits and monitoring. The app enforces a per-member usage cap; it does not substitute for a provider billing cap.

## Test before charging
- New user registers, verifies email, sees **no usable AI products** before payment.
- Start a test Checkout Session using owner-approved test prices. Returning to the success URL does **not** unlock access.
- Send a genuine **signed test webhook**. The correct order activates a 30-day license, with the expected products and seats. Replay it: no double-extension.
- Reject invalid signatures, other merchant mode, wrong currency, amount or session, expired license, suspended license, unlicensed product and foreign organization.
- Have a licensed organization owner invite a student/employee; confirm assigned seat access needs no individual payment, but expires when the organization's license expires.
- Confirm a white-label partner can share its referral link; a customer buys a distinct organization license; the partner receives gross referral reporting but **cannot view customer private records**.
- In Front Desk, approve an FAQ, embed `widget.js` on an authorized HTTPS origin, test AI replies, consent-based inquiry receipt, and denial on unapproved origins.
- Test generating and saving AI outputs, sales-stage edits, content approvals and workflow approvals as both member and admin.
- Verify mobile UX on actual iOS and Android devices, keyboard focus, accessibility, webhook retry behavior, checkout error recovery and export.
- Confirm spend monitoring, privacy notices, data deletion/retention, support channel, merchant disclosures and any applicable taxes, refunds and cancellation rules.

## Release policy
Do **not** expose live checkout, advertise service readiness or merge the application into a production routing path until the checklist is evidenced. Test credentials cannot accept real payment. Migrating to live PayMongo must include new live key, live endpoint + signature secret and an independently verified low-value payment.
