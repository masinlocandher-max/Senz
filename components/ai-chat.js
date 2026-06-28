(() => {
  if (window.__senzAiChatLoaded) return;
  window.__senzAiChatLoaded = true;

  const answers = [
    {
      match: ['service', 'offer', 'what do you do', 'services'],
      reply: 'SENZ Strategic Communications helps with strategic communications, PR and public image, marketing and social media, call center solutions, websites and digital presence, creative production, and digital products.'
    },
    {
      match: ['price', 'pricing', 'cost', 'rate', 'budget'],
      reply: 'Pricing depends on the service path, scope, timeline, and level of production. The best next step is to choose a service on the Get Started page so SENZ can recommend the right route.'
    },
    {
      match: ['website', 'digital presence', 'web'],
      reply: 'For websites and digital presence, SENZ focuses on clear messaging, premium design, service flow, and conversion paths so visitors understand and trust the brand faster.'
    },
    {
      match: ['pr', 'public image', 'reputation', 'media'],
      reply: 'For PR and public image, SENZ helps shape credibility, visibility, narrative, and reputation signals before the public forms an opinion.'
    },
    {
      match: ['marketing', 'social', 'campaign', 'content'],
      reply: 'For marketing and social media, SENZ builds campaign direction, content pillars, posting rhythm, and audience movement so the brand feels consistent and memorable.'
    },
    {
      match: ['call center', 'customer', 'inquiry', 'support'],
      reply: 'For call center solutions, SENZ helps organize inquiry flow, support scripts, lead handling, response standards, and customer communication routes.'
    },
    {
      match: ['ebook', 'reader', 'book'],
      reply: 'The Reader Library is paid access. You can preview an ebook on the site, then purchase through the ebook checkout page. Access is sent after payment verification.'
    },
    {
      match: ['clone', 'ai', 'assistant', 'music', 'voting', 'tabulation', 'ticket'],
      reply: 'Digital products include music assets, consent-based Clone Studio, voting/tabulation and ticketing platforms, and personal AI assistants. SENZ can recommend the best product path after a quick inquiry.'
    },
    {
      match: ['contact', 'email', 'message', 'book', 'consultation'],
      reply: 'You can reach SENZ through the Get Started page. Choose the service first, then leave your preferred contact method so the team can respond properly.'
    }
  ];

  const quickPrompts = [
    'What services do you offer?',
    'How much does it cost?',
    'I need PR help',
    'I need a website',
    'Tell me about digital products'
  ];

  function getReply(text) {
    const normalized = text.toLowerCase();
    const found = answers.find((item) => item.match.some((word) => normalized.includes(word)));
    if (found) return found.reply;
    return 'I can answer general questions about SENZ services, ebooks, digital products, and how to start. For project-specific advice, please go to Get Started so SENZ can review your details properly.';
  }

  function appendMessage(log, message, type) {
    const bubble = document.createElement('div');
    bubble.className = `senz-ai-message ${type}`;
    bubble.textContent = message;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function initChat() {
    const root = document.createElement('aside');
    root.className = 'senz-ai-chat';
    root.setAttribute('aria-label', 'SENZ AI assistant');
    root.innerHTML = `
      <div class="senz-ai-panel" role="dialog" aria-label="SENZ AI assistant" aria-hidden="true">
        <div class="senz-ai-head">
          <div>
            <span class="senz-ai-kicker">AI Concierge</span>
            <h2 class="senz-ai-title">Ask SENZ</h2>
          </div>
          <button class="senz-ai-close" type="button" aria-label="Close AI chat">&times;</button>
        </div>
        <div class="senz-ai-log" aria-live="polite"></div>
        <div class="senz-ai-prompts" aria-label="Suggested questions"></div>
        <p class="senz-ai-note">This assistant answers general questions. For pricing, scope, and booking, continue to Get Started.</p>
        <a class="senz-ai-cta" href="get-started.html">Go to Get Started</a>
        <form class="senz-ai-form">
          <input class="senz-ai-input" type="text" autocomplete="off" placeholder="Ask a general question..." aria-label="Ask a general question" />
          <button class="senz-ai-send" type="submit">Send</button>
        </form>
      </div>
      <button class="senz-ai-button" type="button" aria-label="Open SENZ AI assistant" aria-expanded="false">
        <span class="senz-ai-pulse" aria-hidden="true"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-3l-4 3v-3H9a4 4 0 0 1-4-4V8Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/></svg>
        <span class="senz-ai-label">Ask SENZ AI</span>
      </button>
    `;

    document.body.appendChild(root);

    const toggle = root.querySelector('.senz-ai-button');
    const panel = root.querySelector('.senz-ai-panel');
    const close = root.querySelector('.senz-ai-close');
    const log = root.querySelector('.senz-ai-log');
    const prompts = root.querySelector('.senz-ai-prompts');
    const form = root.querySelector('.senz-ai-form');
    const input = root.querySelector('.senz-ai-input');

    appendMessage(log, 'Hi, I can answer general questions about SENZ Strategic Communications and guide you to the right service path.', 'bot');

    quickPrompts.forEach((prompt) => {
      const button = document.createElement('button');
      button.className = 'senz-ai-chip';
      button.type = 'button';
      button.textContent = prompt;
      button.addEventListener('click', () => {
        appendMessage(log, prompt, 'user');
        appendMessage(log, getReply(prompt), 'bot');
      });
      prompts.appendChild(button);
    });

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      if (open) setTimeout(() => input.focus(), 120);
    }

    toggle.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
    close.addEventListener('click', () => setOpen(false));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      appendMessage(log, value, 'user');
      appendMessage(log, getReply(value), 'bot');
      input.value = '';
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
