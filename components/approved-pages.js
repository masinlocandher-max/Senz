(() => {
  const polishStylesheet = document.createElement("link");
  polishStylesheet.rel = "stylesheet";
  polishStylesheet.href = "components/launch-polish.css?v=20260710-launch";
  document.head.appendChild(polishStylesheet);

  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";

  if (main && !document.querySelector(".skip-link")) {
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    document.body.prepend(skipLink);
  }

  const navShell = document.querySelector(".site-header .nav");
  const navLinks = navShell?.querySelector(".nav-links");

  if (navShell && navLinks && !navShell.querySelector(".nav-toggle")) {
    navLinks.id = navLinks.id || "primary-navigation";
    const navToggle = document.createElement("button");
    navToggle.type = "button";
    navToggle.className = "nav-toggle";
    navToggle.setAttribute("aria-label", "Open navigation");
    navToggle.setAttribute("aria-controls", navLinks.id);
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.innerHTML = "<span></span>";
    navShell.insertBefore(navToggle, navLinks);

    const closeNavigation = () => {
      navShell.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navShell.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeNavigation();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });
  }

  const modal = document.querySelector("#consultModal");
  let lastFocusedElement = null;

  function openConsultation() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modal.querySelector("input, select, textarea, button")?.focus(), 0);
  }

  function closeConsultation() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocusedElement?.focus?.();
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
    if (event.key === "Escape" && modal?.classList.contains("is-open")) closeConsultation();
  });

  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.min) input.min = localDate;
  });

  document.querySelectorAll("[data-senz-form]").forEach((form) => {
    window.SENZForms?.bind(form);
  });

  document.querySelectorAll("[data-faq-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.faqFilter;
      document.querySelectorAll("[data-faq-filter]").forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      document.querySelectorAll("[data-faq-category]").forEach((item) => {
        item.hidden = category !== "all" && item.dataset.faqCategory !== category;
      });
    });
  });

  document.querySelectorAll(".faq-question").forEach((button, index) => {
    const item = button.closest(".faq-item");
    const answer = item?.querySelector(".faq-answer");
    if (!item || !answer) return;

    const answerId = answer.id || `faq-answer-${index + 1}`;
    answer.id = answerId;
    button.setAttribute("aria-controls", answerId);
    button.setAttribute("aria-expanded", String(item.classList.contains("is-open")));

    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
})();