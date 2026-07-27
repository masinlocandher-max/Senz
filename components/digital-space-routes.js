(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const route = (params.get('path') || '').trim().toLowerCase();
  if (!['own', 'rent'].includes(route)) return;

  const inquiryType = document.querySelector('select[name="inquiryType"]');
  const digitalProductsOption = inquiryType
    ? Array.from(inquiryType.options).find((option) => option.value === 'Digital Products')
    : null;
  if (digitalProductsOption) inquiryType.value = digitalProductsOption.value;

  const message = document.querySelector('textarea[name="message"]');
  const formHeading = document.querySelector('.form-panel h2');
  const formIntro = document.querySelector('.form-panel .body-copy');

  const routes = {
    own: {
      heading: 'Plan Your Own Digital Space',
      intro: 'Tell SENZ what the space should help people do, who will use it, and what must be fully owned by your brand.',
      prompt: 'I am interested in owning a custom digital space built around my brand, audience, content, and workflow. The idea or project I want to develop is: ',
    },
    rent: {
      heading: 'Ask About a Rental Digital Space',
      intro: 'Start with a SENZ-powered branded space, validate how people use it, and decide later whether a full custom build is the right investment.',
      prompt: 'I am interested in renting a SENZ-powered branded digital space before investing in a full custom build. The idea, audience, or experience I want to test is: ',
    },
  };

  const selected = routes[route];
  if (formHeading) formHeading.textContent = selected.heading;
  if (formIntro) formIntro.textContent = selected.intro;
  if (message && !message.value.trim()) message.value = selected.prompt;

  const source = (params.get('source') || '').trim();
  if (source && message) message.dataset.referralSource = source;
})();
