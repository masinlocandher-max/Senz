(() => {
  const polishStylesheet = document.createElement("link");
  polishStylesheet.rel = "stylesheet";
  polishStylesheet.href = "components/launch-polish.css?v=20261101-signature-v5";
  document.head.insertBefore(polishStylesheet, document.querySelector('link[href*="components/signature.css"]'));

  const glassNavigationStylesheet = document.createElement("link");
  glassNavigationStylesheet.rel = "stylesheet";
  glassNavigationStylesheet.href = "components/glass-nav.css?v=20260711-glass";
  document.head.insertBefore(glassNavigationStylesheet, document.querySelector('link[href*="components/signature.css"]'));

  const iconSystemStylesheet = document.createElement("link");
  iconSystemStylesheet.rel = "stylesheet";
  iconSystemStylesheet.href = "components/senz-icon-system.css?v=20260711-concepts";
  document.head.insertBefore(iconSystemStylesheet, document.querySelector('link[href*="components/signature.css"]'));

  const mobileAppStylesheet = document.createElement("link");
  mobileAppStylesheet.rel = "stylesheet";
  mobileAppStylesheet.href = "components/mobile-app-shell.css?v=20261031-navigation";
  document.head.insertBefore(mobileAppStylesheet, document.querySelector('link[href*="components/signature.css"]'));

  const mobileServicesStylesheet = document.createElement("link");
  mobileServicesStylesheet.rel = "stylesheet";
  mobileServicesStylesheet.href = "components/mobile-services-shell.css?v=20260712-iphone";
  document.head.insertBefore(mobileServicesStylesheet, document.querySelector('link[href*="components/signature.css"]'));

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && !viewport.content.includes("viewport-fit=cover")) {
    viewport.content = `${viewport.content}, viewport-fit=cover`;
  }

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

  if (main && !document.querySelector('.skip-link, .senz-skip')) {
    const skip = document.createElement('a');
    skip.className = 'senz-skip';
    skip.href = '#' + main.id;
    skip.textContent = 'Skip to main content';
    document.body.prepend(skip);
  }

  const modal = document.querySelector("#consultModal");
  let lastFocusedElement = null;

  function openConsultation() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    modal.removeAttribute("inert");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("consultation-open");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modal.querySelector("input, select, textarea, button")?.focus(), 0);
  }

  function closeConsultation() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
    document.body.classList.remove("consultation-open");
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
    if (!modal?.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeConsultation();
    if (event.key === 'Tab') {
      const controls = [...modal.querySelectorAll('a[href], button, input, select, textarea')].filter(n => !n.disabled && n.offsetWidth && n.tabIndex >= 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

  const query = new URLSearchParams(window.location.search);
  const interest = query.get('interest');
  const legacyProducts = { 'AI Workspace':'ai-workspace', 'Workspace':'ai-workspace', 'Communications Intelligence':'communications-intelligence',
    'Digital Assistant':'digital-assistant', 'Client Portal':'client-portal', 'Event Systems':'event-systems',
    'Digital Representative':'digital-representative', 'QR Menu':'qr-menu', 'Booking':'booking',
    'Digital Catalog':'digital-catalog', 'Business Website':'business-website', 'CRM':'crm', 'POS':'pos', 'Loyalty':'loyalty' };
  if (currentPage === 'contact.html' && query.has('offer') && legacyProducts[interest]) {
    location.replace('purchase.html?product=' + legacyProducts[interest]);
    return;
  }
  const inquiryType = document.querySelector('select[name="inquiryType"]');
  if (interest && inquiryType) {
    const value = interest.trim().slice(0, 160);
    let matchingOption = Array.from(inquiryType.options).find((option) => option.value === value);
    if (!matchingOption && value) {
      matchingOption = document.createElement("option");
      matchingOption.value = value;
      matchingOption.textContent = value;
      inquiryType.append(matchingOption);
    }
    if (matchingOption) inquiryType.value = matchingOption.value;
  }

  const serviceForm = document.querySelector('form[data-form-kind="general"]');
  const clientTopics = {
    request: 'I have already submitted a SENZ request. Please help me confirm the next step. My request reference (if available): ',
    access: 'I am an existing SENZ client and need help finding or restoring my workspace invitation. My business or organization: ',
    install: 'I am an existing SENZ client and need help installing SENZ App. My device and browser: '
  };
  const isClientSupport = serviceForm && Object.hasOwn(clientTopics, query.get('client'));
  if (isClientSupport) {
    serviceForm.dataset.clientSupport = 'true';
    if (!serviceForm.elements.message.value) serviceForm.elements.message.value = clientTopics[query.get('client')];
    // Returning clients need assistance, not another sales qualification form.
    const hero = serviceForm.closest('.hero');
    const panel = serviceForm.closest('.form-panel');
    hero.querySelector('h1').textContent = 'Welcome back.';
    hero.querySelector('.kicker').textContent = 'Client support';
    hero.querySelector('.lead').textContent = 'Tell us what you need help with. Use the email on your SENZ account or earlier request.';
    hero.querySelector('.trust-row')?.remove();
    panel.querySelector('.mini-label').textContent = 'Existing clients';
    panel.querySelector('h2').textContent = 'How can we help?';
    panel.querySelector('.body-copy').textContent = 'Include your request reference if you have one. We’ll review your message and reply by email.';
    for (const name of ['timeline', 'budget', 'position', 'phone']) serviceForm.elements[name]?.closest('label')?.remove();
    const topic = document.createElement('input');
    topic.type = 'hidden'; topic.name = 'inquiryType'; topic.value = 'Existing client support';
    serviceForm.elements.inquiryType.closest('label').replaceWith(topic);
    serviceForm.elements.message.closest('label').firstChild.textContent = 'Your message *';
    serviceForm.querySelector('button[type="submit"]').textContent = 'Send support request';
    document.querySelectorAll('main > .page-section').forEach(section => section.remove());
  }
  if (serviceForm && !isClientSupport && query.get('planner') === '1') {
    fetch('components/product-catalog.json').then(r => r.ok ? r.json() : null).then(catalog => {
      if (!catalog) return;
      const ids = [...new Set((query.get('tools') || '').split(','))];
      const chosen = ids.map(id => catalog.products.find(p => p.id === id));
      const count = window.SENZDiscovery?.seatCount(query.get('seats'));
      if (!count || !chosen.length || chosen.some(p => !p)) return;
      if (!serviceForm.elements.message.value) serviceForm.elements.message.value =
        `Please confirm availability and quote these tools: ${chosen.map(p => p.name).join(', ')}. ${count} named users per tool in one workspace. Please confirm setup requirements, any suitable bundle, and the final total.`;
    }).catch(() => {});
  }
  if (serviceForm && !isClientSupport && window.SENZDiscovery && query.get('guide') === '1') {
    function prefill(catalog) {
      const guided = window.SENZDiscovery.readHandoff(location.search, 'service', catalog);
      if (!guided) return;
      if (!serviceForm.elements.timeline.value) serviceForm.elements.timeline.value = guided.timeline;
      if (!serviceForm.elements.message.value) serviceForm.elements.message.value = guided.message;
    }
    if (query.get('route') === 'software' && query.get('scope') === 'estimate') {
      fetch('components/product-catalog.json').then(r => r.ok ? r.json() : null)
        .then(catalog => { if (catalog) prefill(catalog); }).catch(() => {});
    } else prefill();
  }

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

  // On phones these grids become sideways carousels. While one scrolls, keyboard users need to
  // reach it, so it becomes a labelled, focusable region; on wider screens it is left alone.
  const carousels = document.querySelectorAll(".icon-grid, .service-grid, .reason-grid, .fit-grid, .process-grid, .deliverable-grid");
  const updateCarousels = () => {
    carousels.forEach((grid) => {
      if (grid.scrollWidth > grid.clientWidth + 1) {
        const heading = grid.closest("section")?.querySelector("h2, h3")?.textContent.trim();
        grid.setAttribute("tabindex", "0");
        grid.setAttribute("role", "region");
        grid.setAttribute("aria-label", heading ? `${heading} (scroll sideways)` : "Scroll sideways for more");
      } else if (grid.getAttribute("role") === "region") {
        grid.removeAttribute("tabindex");
        grid.removeAttribute("role");
        grid.removeAttribute("aria-label");
      }
    });
  };
  if (carousels.length) {
    updateCarousels();
    window.addEventListener("load", updateCarousels);
    window.addEventListener("resize", updateCarousels);
  }
})();

