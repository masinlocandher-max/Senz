# BACKEND AND ENDPOINT AUDIT

PAGE: Contact Us
ISSUE: Send Us A Message form has no production email endpoint.
CURRENT STATUS: The form prepares a `mailto:` message to `info.senz.pr@gmail.com` with the required inquiry fields and includes a TODO for Formspree, EmailJS, Google Forms, Airtable, Zapier, or a custom backend. It does not silently fake a successful email send.
NEEDED FIX: Connect the form to an approved email/form backend that sends `New SENZ Website Inquiry - [Full Name]` to `info.senz.pr@gmail.com`.
PRIORITY: High

PAGE: Home, About, Services
ISSUE: Book a Consultation modal has no production appointment request endpoint.
CURRENT STATUS: The modal prepares a pending consultation email to `info.senz.pr@gmail.com` and shows the required pending-review message. It does not route to Contact Us and does not confirm a calendar booking.
NEEDED FIX: Connect the modal to an approved backend that sends `New SENZ Consultation Request - [Full Name]` to `info.senz.pr@gmail.com`.
PRIORITY: High

PAGE: Home, About, Services
ISSUE: Calendar approval workflow is not connected.
CURRENT STATUS: There is no real calendar integration. The site correctly does not auto-confirm or auto-add appointments to a calendar.
NEEDED FIX: Add a pending appointment workflow later: submit request, SENZ reviews by email/admin, then approved appointments are added to calendar.
PRIORITY: High

PAGE: Careers
ISSUE: Creative Pool / Submit Portfolio form has no production email endpoint.
CURRENT STATUS: The form prepares a `mailto:` message to `info.senz.pr@gmail.com` using the required subject format and includes a TODO for later backend connection.
NEEDED FIX: Connect the form to an approved email/form backend that sends `New SENZ Creative Pool Submission - [Full Name]` to `info.senz.pr@gmail.com`.
PRIORITY: High

PAGE: All Approved Pages
ISSUE: Static `mailto:` fallback depends on the visitor having an email client configured.
CURRENT STATUS: This is deployment-friendly and honest, but it is not a reliable production submission system.
NEEDED FIX: Choose and connect a production form service or custom backend before launch.
PRIORITY: High

PAGE: All Approved Pages
ISSUE: Existing `/api/inquiries` backend is present but not wired to send email.
CURRENT STATUS: `server.js` exposes `/api/inquiries` for saving inquiry records, but approved forms currently use static `mailto:` preparation and TODO comments because no email service credentials are connected.
NEEDED FIX: Decide whether to use the existing Node endpoint with an email provider, or replace with Formspree, EmailJS, Google Forms, Airtable, or Zapier.
PRIORITY: Medium

PAGE: FAQ
ISSUE: FAQ Contact Us CTA endpoint.
CURRENT STATUS: The CTA routes to `contact.html`, which is approved.
NEEDED FIX: No link fix needed. Backend dependency is covered by the Contact Us form issue above.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Broken internal links after deleting unapproved pages.
CURRENT STATUS: Checked approved pages. No internal links point to deleted `get-started.html` or `shop/index.html`; no broken approved-page links found.
NEEDED FIX: Re-run link checks after any future page or navigation edits.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Placeholder `href="#"`, empty `href`, and `javascript:void(0)` links.
CURRENT STATUS: Checked approved pages. No placeholder href values found.
NEEDED FIX: Keep modal triggers as buttons instead of placeholder anchors.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Asset references.
CURRENT STATUS: Checked linked CSS, JavaScript, logo, and image paths used by approved pages. No missing linked assets found.
NEEDED FIX: Re-run asset checks after replacing image placeholders or adding final media.
PRIORITY: Low

PAGE: Home
ISSUE: Optional ambient music file dependency.
CURRENT STATUS: Home references `assets/senz-reception-music.mp3`. The file exists locally, and the control is user-activated rather than autoplaying.
NEEDED FIX: No endpoint fix needed. Confirm the same file is present after deployment.
PRIORITY: Low

PAGE: Contact Us
ISSUE: Map is still a placeholder.
CURRENT STATUS: Contact Us includes a map placeholder, which matches the current prototype requirement but is not a live map.
NEEDED FIX: Add an approved embedded map or final static location image before public launch if desired.
PRIORITY: Medium

PAGE: All Approved Pages
ISSUE: Form validation review.
CURRENT STATUS: Required fields are present on the main forms. Contact Us allows optional phone, company, and position as requested. Consultation modal collects required schedule/contact fields and project notes. Careers collects role, name, email, phone, portfolio, and short introduction.
NEEDED FIX: Confirm final required/optional business rules before backend integration.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Unapproved standalone pages.
CURRENT STATUS: Only the six approved HTML pages remain: `index.html`, `about.html`, `services.html`, `careers.html`, `contact.html`, and `faq.html`. `get-started.html` and `shop/index.html` were removed.
NEEDED FIX: Do not re-add unapproved pages unless formally approved.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Top navigation compliance.
CURRENT STATUS: Top navigation shows only Home, About, Services, Careers, Contact Us, and FAQ. Book a Consultation is not in the top navigation.
NEEDED FIX: Re-check navigation after future edits.
PRIORITY: Low
