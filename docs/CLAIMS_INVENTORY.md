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

## Removed by owner decision (October 29, 2026)

- **SENZ Music.** The division page `music.html` is deleted, together with the Music Platform software page `music-platform.html` that an earlier draft had added, the SENZ Music entry in `components/division-services.js` (which no page loaded), and the roadmap line. Its artist spotlight, chart, and sponsor placements are therefore no longer published, and no owner confirmation is needed for them.
- **FotoLab and Music Platform.** Both are parked in the app: not offered, not in any plan, and no longer exported to the website. Discovery, the AI Systems page, `llms.txt`, the FAQ, the chat helper, and `agents.js` now describe six products.

`test/catalog.test.mjs` fails if any public page or component mentions SENZ Music, FotoLab, Music Platform, or links to the removed pages. General creative services that include music or photography as part of a campaign (`services.html`) are SENZ agency work, not these products, and stay.
