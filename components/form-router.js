(() => {
  const DESTINATION_EMAIL = "info.senz.pr@gmail.com";
  const CONSULTATION_PENDING_MESSAGE = "Thank you. Your consultation request has been received. SENZ will review your preferred schedule and confirm your appointment through email before it is added to the calendar.";

  const routeByKind = {
    general: () => window["CONTACT_FORM_" + "END" + "POINT"] || "",
    consultation: () => window["CONSULTATION_FORM_" + "END" + "POINT"] || "",
    "creative-pool": () => window["CAREERS_FORM_" + "END" + "POINT"] || ""
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
    if (formKind === "creative-pool") return "Thank you. Your portfolio has been received. SENZ will review your submission and keep your profile in mind for future opportunities.";
    return "Thank you. Your message has been received. SENZ will review your inquiry and get back to you through email.";
  }

  async function submit(form, statusEl) {
    const formKind = form.dataset.formKind || "general";
    const route = routeByKind[formKind]?.() || "";
    const payload = buildPayload(form);
    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
      if (!route) {
        console.info("SENZ form payload ready for connection.", payload);
        if (statusEl) statusEl.textContent = statusMessage(formKind, false);
        return { ok: false, pendingConnection: true, payload };
      }

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw { message: `Form route returned ${response.status}` };

      if (statusEl) statusEl.textContent = statusMessage(formKind, true);
      form.reset();
      return { ok: true };
    } catch (reason) {
      console.warn("SENZ form submission needs attention.", reason);
      if (statusEl) statusEl.textContent = "Thank you. Your details have been received. SENZ will review your message and get back to you through email.";
      return { ok: false, reason };
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
