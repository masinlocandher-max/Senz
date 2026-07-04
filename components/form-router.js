(() => {
  const DESTINATION_EMAIL = "info.senz.pr@gmail.com";
  const CONSULTATION_PENDING_MESSAGE = "Thank you. Your consultation request has been received. SENZ will review your preferred schedule and confirm your appointment through email before it is added to the calendar.";

  const endpointByKind = {
    general: () => window.CONTACT_FORM_ENDPOINT || "",
    consultation: () => window.CONSULTATION_FORM_ENDPOINT || "",
    "creative-pool": () => window.CAREERS_FORM_ENDPOINT || ""
  };

  function now() {
    return new Date().toLocaleString();
  }

  function valuesFrom(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function buildPayload(form) {
    const formKind = form.dataset.formKind || "general";
    const values = valuesFrom(form);
    const submittedAt = now();
    const fullName = values.name || values.fullName || "Website Visitor";

    if (formKind === "consultation") {
      return {
        formType: "consultation",
        status: "pending",
        destinationEmail: DESTINATION_EMAIL,
        subject: `New SENZ Consultation Request - ${fullName}`,
        submittedAt,
        fields: {
          preferredDate: values.date || "",
          preferredTime: values.time || "",
          fullName,
          email: values.email || "",
          phone: values.phone || "",
          organization: values.organization || "",
          service: values.service || "",
          notes: values.notes || ""
        },
        calendarRule: "Pending request only. Do not confirm or add to calendar until SENZ approves."
      };
    }

    if (formKind === "creative-pool") {
      return {
        formType: "creative-pool",
        destinationEmail: DESTINATION_EMAIL,
        subject: `New SENZ Creative Pool Submission - ${fullName}`,
        submittedAt,
        fields: {
          fullName,
          email: values.email || "",
          creativeRole: values.role || "",
          portfolioLink: values.portfolio || "",
          shortIntroduction: values.introduction || values.experience || ""
        }
      };
    }

    return {
      formType: "general",
      destinationEmail: DESTINATION_EMAIL,
      subject: `New SENZ Website Inquiry - ${fullName}`,
      submittedAt,
      fields: {
        fullName,
        email: values.email || "",
        phone: values.phone || "",
        organization: values.organization || "",
        position: values.position || "",
        inquiryType: values.inquiryType || "",
        message: values.message || ""
      }
    };
  }

  function statusMessage(formKind, sent) {
    if (formKind === "consultation") return CONSULTATION_PENDING_MESSAGE;
    if (sent) return "Thank you. Your message has been sent to SENZ Strategic Communications.";
    return "Prototype mode: the production endpoint is not connected yet. No email was sent.";
  }

  async function submit(form, statusEl) {
    const formKind = form.dataset.formKind || "general";
    const endpoint = endpointByKind[formKind]?.() || "";
    const payload = buildPayload(form);
    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
      if (!endpoint) {
        // TODO: Add the deployed Google Apps Script Web App URL in site-config.js.
        console.info("SENZ form prototype payload. No production endpoint configured.", payload);
        if (statusEl) statusEl.textContent = statusMessage(formKind, false);
        return { ok: false, prototype: true, payload };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Endpoint returned ${response.status}`);

      if (statusEl) statusEl.textContent = statusMessage(formKind, true);
      form.reset();
      return { ok: true };
    } catch (error) {
      console.error("SENZ form submission failed.", error);
      if (statusEl) statusEl.textContent = "We could not submit the form yet. Please try again later or email info.senz.pr@gmail.com.";
      return { ok: false, error };
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  function bind(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".status, .consult-status, .form-status");
      submit(form, status);
    });
  }

  window.SENZForms = {
    bind,
    submit,
    buildPayload,
    CONSULTATION_PENDING_MESSAGE
  };
})();
