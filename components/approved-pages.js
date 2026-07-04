const modal = document.querySelector("#consultModal");
const SENZ_INQUIRY_EMAIL = "info.senz.pr@gmail.com";
const CONSULTATION_PENDING_MESSAGE = "Thank you. Your consultation request has been received. SENZ will review your preferred schedule and confirm your appointment through email before it is added to the calendar.";

function openConsultation() {
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeConsultation() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-consult-open]").forEach((button) => {
  button.addEventListener("click", openConsultation);
});

document.querySelectorAll("[data-consult-close]").forEach((button) => {
  button.addEventListener("click", closeConsultation);
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeConsultation();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeConsultation();
});

document.querySelectorAll("[data-prototype-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector(".status, .consult-status");
    const formKind = form.dataset.formKind || "general";
    const values = Object.fromEntries(new FormData(form).entries());
    const submittedAt = new Date().toLocaleString();
    const fullName = values.name || values.fullName || "Website Visitor";
    let subject = `New SENZ Website Inquiry - ${fullName}`;
    let lines = [];

    if (formKind === "consultation") {
      subject = `New SENZ Consultation Request - ${fullName}`;
      lines = [
        "New SENZ Consultation Request",
        "",
        `Preferred date: ${values.date || ""}`,
        `Preferred time: ${values.time || ""}`,
        `Full name: ${fullName}`,
        `Email: ${values.email || ""}`,
        `Phone number: ${values.phone || ""}`,
        `Business or organization: ${values.organization || ""}`,
        `Service needed: ${values.service || ""}`,
        "",
        "Project notes:",
        values.notes || "",
        "",
        `Submission date and time: ${submittedAt}`,
        "",
        "Calendar note: this is a pending request. Do not add to the calendar until SENZ approves the schedule."
      ];
    } else if (formKind === "creative-pool") {
      subject = `New SENZ Creative Pool Submission - ${fullName}`;
      lines = [
        "New SENZ Creative Pool Submission",
        "",
        `Full name: ${fullName}`,
        `Email: ${values.email || ""}`,
        `Creative role: ${values.role || ""}`,
        `Portfolio link: ${values.portfolio || ""}`,
        "",
        "Short introduction:",
        values.introduction || values.experience || "",
        "",
        `Date and time of submission: ${submittedAt}`
      ];
    } else {
      lines = [
        "New SENZ Website Inquiry",
        "",
        `Full name: ${fullName}`,
        `Email address: ${values.email || ""}`,
        `Phone number: ${values.phone || ""}`,
        `Company or organization: ${values.organization || ""}`,
        `Position or role: ${values.position || ""}`,
        `Inquiry type: ${values.inquiryType || ""}`,
        "",
        "Message:",
        values.message || "",
        "",
        `Date and time of submission: ${submittedAt}`
      ];
    }

    // TODO: Replace this mailto preparation with Formspree, EmailJS, Google Forms,
    // Airtable, Zapier, or a custom backend email endpoint when production email is ready.
    window.location.href = `mailto:${SENZ_INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;

    if (status) {
      status.textContent = formKind === "consultation"
        ? CONSULTATION_PENDING_MESSAGE
        : "Thank you. Your message has been prepared for SENZ Strategic Communications at info.senz.pr@gmail.com.";
    }
  });
});

document.querySelectorAll("[data-faq-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.faqFilter;
    document.querySelectorAll("[data-faq-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelectorAll("[data-faq-category]").forEach((item) => {
      item.hidden = category !== "all" && item.dataset.faqCategory !== category;
    });
  });
});

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    item?.classList.toggle("is-open");
  });
});
