(() => {
  const polishStylesheet = document.createElement("link");
  polishStylesheet.rel = "stylesheet";
  polishStylesheet.href = "components/launch-polish.css?v=20260710-launch";
  document.head.appendChild(polishStylesheet);

  const glassNavigationStylesheet = document.createElement("link");
  glassNavigationStylesheet.rel = "stylesheet";
  glassNavigationStylesheet.href = "components/glass-nav.css?v=20260711-glass";
  document.head.appendChild(glassNavigationStylesheet);

  const iconSystemStylesheet = document.createElement("link");
  iconSystemStylesheet.rel = "stylesheet";
  iconSystemStylesheet.href = "components/senz-icon-system.css?v=20260711-concepts";
  document.head.appendChild(iconSystemStylesheet);

  const conceptIcons = {
    positioning: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path class="icon-secondary" d="M24 16h-8v8M40 16h8v8M48 40v8h-8M24 48h-8v-8" />
        <path class="icon-accent" d="M32 20 44 32 32 44 20 32Z" />
        <path d="M32 20v8M44 32h-8M32 44v-8M20 32h8" />
        <circle class="icon-dot" cx="32" cy="32" r="3.5" />
      </svg>`,
    messaging: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path class="icon-accent" d="M17 17h30a7 7 0 0 1 7 7v15a7 7 0 0 1-7 7H31l-11 8v-8h-3a7 7 0 0 1-7-7V24a7 7 0 0 1 7-7Z" />
        <path d="M21 28h22M21 35h15" />
        <circle class="icon-dot" cx="44" cy="35" r="2.4" />
      </svg>`,
    presence: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect class="icon-secondary" x="13" y="15" width="34" height="34" rx="10" />
        <rect class="icon-accent" x="20" y="10" width="31" height="39" rx="10" />
        <circle cx="35.5" cy="27" r="6" />
        <path d="M27 41c1.8-5.5 5-8 8.5-8s6.7 2.5 8.5 8" />
        <circle class="icon-dot" cx="49" cy="15" r="2.5" />
      </svg>`,
    influence: `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle class="icon-accent" cx="25" cy="32" r="5" />
        <path d="M32 24a11 11 0 0 1 0 16" />
        <path class="icon-secondary" d="M38 18a20 20 0 0 1 0 28" />
        <path d="M44 13a27 27 0 0 1 0 38" />
        <circle class="icon-dot" cx="37.5" cy="20" r="2.2" />
        <circle class="icon-dot" cx="44.5" cy="49" r="2.2" />
      </svg>`
  };

  document.querySelectorAll(".icon-card").forEach((card) => {
    const label = card.querySelector("h3")?.textContent.trim().toLowerCase();
    const icon = card.querySelector(".icon");
    if (!icon || !conceptIcons[label]) return;
    icon.dataset.senzIcon = label;
    icon.innerHTML = conceptIcons[label];
  });

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
