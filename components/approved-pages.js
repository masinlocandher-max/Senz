const modal = document.querySelector("#consultModal");

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
    if (status) status.textContent = "Prototype form noted. Connect this form to the backend before launch.";
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
