# Claims inventory

Every sentence on a public page, AI-readable file, script, or structured data that mentions compliance, certification, accreditation, legal or regulatory alignment, or a regulator must be listed here with its basis. `test/claims.test.mjs` fails if a public file contains such a sentence that is not listed below verbatim.

Adding a claim needs written evidence, for example:

- a signed agreement template;
- a registration;
- a certificate;
- legal review.

Do not add a claim because it sounds reassuring.

| Sentence | Where | Basis | Status |
| --- | --- | --- | --- |
| SENZ does not claim certification or regulatory compliance without verification. | `institutional.html`, Data Privacy | Disclaimer. It states that no such claim is made. | Approved wording, Oct 29, 2026 |
| SENZ does not promise procurement eligibility or regulatory compliance without verification. | `institutional.html`, Procurement Pathways | Disclaimer. | Approved wording |

## Removed claims

The following statements were on pages or in drafts and have been removed or rewritten. Do not bring them back without the evidence above.

| Removed statement | Where | Why |
| --- | --- | --- |
| "Agreements include data processing terms aligned to RA 10173 (Data Privacy Act), NPC advisory guidance, and your institution's own data policies." | `institutional.html` | No institutional agreement or data processing terms exist yet (customer agreements are still to be prepared). Rewritten as a process statement: terms are set in each written agreement and reviewed with the institution before any personal data is processed. |
| "responsible AI practices aligned to Philippine law" | `institutional.html` hero | Legal alignment is not verified. Rewritten to describe what the app enforces: named seats, separate workspaces, drafts marked for human review, assistants limited to approved knowledge. |
| "CHED and DepEd data governance alignment" | `institutional.html` (#27) | Unverified regulatory claim; removed in #28. |
| "tracking coverage and sentiment" for Communications Intelligence | `institutional.html` (#27) | Not a function of the product; removed in #28. |
| Event Systems "voting, tabulation, live dashboards", ticketing | several pages (live site and #27) | Not part of Event Systems; now stated only as a limit. |

## Other commitments that need owner confirmation

These are not compliance claims, but they promise something the owner must stand behind. Confirm or remove before publishing:

- `institutional.html`: "Early adopters contribute to product requirements and receive priority provisioning." This is a commercial benefit with no approved terms.
- `institutional.html`: "Seat transfers require authorization from the institution's designated SENZ administrator." In the app, the organization's owners and administrators assign and revoke seats; the wording should match.

## SENZ Music division page

`music.html` is the SENZ Music division page that is live on `main`. An earlier draft (#27) replaced it with the Music Platform software page. The software page now has its own URL, `music-platform.html`, and `music.html` is kept exactly as it is live, except for the logo link's accessible name. `digital-products.html` links to both. The division page's content predates this review and needs the owner's decision before the revised website is promoted:

- "Artist Spotlight: Mara Vale", with a quote and a player showing "Midnight Signal". If Mara Vale is not a real SENZ artist who agreed to be featured, label it as a sample or remove it.
- "Top 10 signals", "Weekly Countdown Cover, Issue 01", and six genre lanes whose "View Tracks" buttons lead back to the countdown section rather than to tracks. Publish real editions or say these are coming.
- "Sponsor Space" and "Small Sidebar Ad" placements, and "built for future Spotify, YouTube, or custom embed integrations". These describe plans, not current offers.
- "Submit your music to SENZ" sends an email to the SENZ inbox. Confirm who reviews submissions and how quickly.

The product-claim tests apply to every page. Their only exception is that "curated countdowns" may appear on `music.html`, because countdowns are division editorial work, not a software feature. A separate test keeps the two pages apart: the software page never describes countdowns or playlists, and the division page never offers the software.
