# Website inquiries: where they go and what happens next

This covers the website's contact, consultation, creative-network, and discovery forms. It does not cover SENZ App customer data, which has its own records in the app.

## Where inquiry data is

| Place | What it holds | Who can see it | How long | How to delete |
| --- | --- | --- | --- | --- |
| Visitor's browser | The form until it is sent; discovery answers on the page | The visitor | Until the page is closed | Nothing stored after sending |
| `senz-api` on Render (`server.js`) | Nothing stored. It checks the form and relays it; it logs only its own start-up line | SENZ, through the Render account | Not stored | Not applicable |
| FormSubmit (`SENZ_FORM_DELIVERY_ENDPOINT`) | The submission it relays by email | FormSubmit, under its own terms | Per FormSubmit's policy | Owner to confirm FormSubmit's retention and deletion process |
| `info.senz.pr@gmail.com` | The delivered email: reference, name, contact details, answers, recommended route, consent | Whoever has access to that inbox | **Owner decision** (see below) | Delete the email and its replies; empty Trash |

Each delivered email carries:

- a reference (the `Submission ID` shown to the visitor);
- "Consent to reply" with the consent version;
- "Marketing consent", which is "No" unless the visitor ticked the separate, optional updates box.

## Lifecycle of one inquiry

1. **Received.** The visitor sees a reference. The email arrives with the same reference.
2. **Acknowledged.** An assigned person replies from the business inbox and labels the email **New**.
3. **Qualified.** Decide whether the inquiry is a SENZ service (quoted engagement) or SENZ App software (a plan or a contract).
   - Software is never activated from an inquiry. Access starts only after the app's verified-payment or signed-contract approval.
4. **Quoted.** Send a written quotation; label the email **Quoted** with the quotation number.
5. **Closed.** Label the email **Won** (link the agreement) or **Lost** (one-line reason). If won and the work is software, the customer requests activation in the app, and SENZ staff approve it only with a verified payment or contract reference.

Until a dedicated tool is chosen, Gmail labels are enough to track this. SENZ could also track its own leads in SENZ CRM once the app is live.

## Requests from people about their data

- **Find:** search the inbox for their email address or reference.
- **Export:** forward the matching emails to the requester, after confirming their identity from the address they used.
- **Delete:** delete the emails and any replies that hold their details. Note the date and reference in a short log without their personal details.
- **Stop updates:** if they ticked the updates box, remove them from any update list the same day.

## Owner decisions

- Who is assigned to the inbox, and the response target for each form type.
- How long inquiry emails are kept, for example 12 months after the last contact unless they became a client.
- Whether FormSubmit stays the relay, after reviewing its retention and terms, or is replaced with a provider SENZ has an agreement with.
- Whether SENZ will send updates at all. If not, remove the optional updates box from the forms.

## Deploy note

The inquiry service now refuses a form without consent to a reply. Publish the website (GitHub Pages) and the inquiry service (Render) from the same merge. A visitor with an old cached page in between sees the error message with the email address, not a false confirmation.
