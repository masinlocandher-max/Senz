window.SENZ_API_BASE_URL = window.SENZ_API_BASE_URL || "https://senz-api-8vt4.onrender.com";

// Production form endpoints.
// Leave these blank to submit forms to `${SENZ_API_BASE_URL}/api/inquiries`.
// Set a deployed Google Apps Script Web App URL only when intentionally routing a form outside the SENZ API.
// Do not commit private credentials or secret keys to this public static site.
window.CONTACT_FORM_ENDPOINT = window.CONTACT_FORM_ENDPOINT || "";
window.CONSULTATION_FORM_ENDPOINT = window.CONSULTATION_FORM_ENDPOINT || "";
window.CAREERS_FORM_ENDPOINT = window.CAREERS_FORM_ENDPOINT || "";

// The inquiry service is hosted on a plan that sleeps when idle and can take up to a minute to
// start. Wake it once, as soon as a visitor starts filling in any form, so the submission itself
// does not wait. The response is not read; a failure here changes nothing for the visitor.
(() => {
  let warmed = false;
  function warmInquiryService() {
    if (warmed) return;
    warmed = true;
    const base = String(window.SENZ_API_BASE_URL || "").replace(/\/$/, "");
    if (!base || typeof fetch !== "function") return;
    fetch(`${base}/api/health`, { method: "GET", mode: "no-cors", cache: "no-store" }).catch(() => {});
  }
  window.SENZWarmInquiryService = warmInquiryService;
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("focusin", (event) => {
      const target = event.target;
      if (target && typeof target.closest === "function" && target.closest("form")) warmInquiryService();
    });
  }
})();
