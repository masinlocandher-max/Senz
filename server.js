const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { agents, recommendAgent } = require("./agents");
const discovery = require("./components/discovery-engine");

const rootDir = __dirname;
const port = Number(process.env.PORT || 4177);
const siteOrigins = String(process.env.SITE_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const inquiryDeliveryEndpoint =
  process.env.SENZ_FORM_DELIVERY_ENDPOINT ||
  "https://formsubmit.co/ajax/info.senz.pr@gmail.com";
const deliveryTimeoutMs = Number(process.env.SENZ_FORM_DELIVERY_TIMEOUT_MS || 15000);
const canonicalHost = process.env.CANONICAL_HOST || "www.senzpr.com";
const redirectHosts = new Set(
  String(process.env.REDIRECT_HOSTS || "senzpr.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(req, res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders(req)
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders(req) {
  if (!siteOrigins.length) return {};
  const origin = String(req.headers.origin || "").trim();
  if (!siteOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function isAllowedOrigin(req) {
  const origin = String(req.headers.origin || "").trim();
  return !siteOrigins.length || !origin || siteOrigins.includes(origin);
}

function clean(value, maxLength = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLong(value, maxLength = 3000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function cleanFields(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
  return Object.fromEntries(
    Object.entries(fields)
      .slice(0, 24)
      .map(([key, value]) => [clean(key, 80), cleanLong(value, 1000)])
      .filter(([key, value]) => key && value)
  );
}

// Consent to a reply is required for every form; consent to marketing is a separate, optional
// choice. The versions are the server's, not values sent by the browser.
const CONSENT_VERSIONS = { discovery: "discovery-2026-10-27", default: "inquiry-2026-10-29" };

function buildInquiry(input) {
  const contact = clean(input.contact || input.phone || input.contactNumber, 180);
  const timeline = clean(input.timeline || input.date || input.availability, 120);
  const formType = clean(input.formType || "general", 40).toLowerCase();
  const messageParts = [
    cleanLong(input.message, 3000),
    input.date ? `Preferred date or callback time: ${clean(input.date, 120)}` : "",
    input.meetingType ? `Meeting type: ${clean(input.meetingType, 120)}` : "",
    input.location ? `Location: ${clean(input.location, 160)}` : "",
    input.locationNote ? `Location note: ${clean(input.locationNote, 240)}` : ""
  ].filter(Boolean);

  const inquiry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    formType,
    name: clean(input.name, 120),
    brand: clean(input.brand, 160),
    email: clean(input.email, 180).toLowerCase(),
    contact,
    preferredContact: clean(input.preferredContact, 80),
    projectType: clean(input.projectType, 160),
    timeline,
    budget: clean(input.budget, 120),
    message: messageParts.join("\n\n").slice(0, 3000),
    source: "website-intake",
    details: cleanFields(input.fields),
    consent: {
      reply: input.consent === true,
      marketing: input.marketingConsent === true,
      version: CONSENT_VERSIONS[clean(input.formType || "general", 40).toLowerCase()] || CONSENT_VERSIONS.default
    }
  };
  const discoveryErrors = [];
  if (formType === 'discovery') {
    const result = discovery.recommend(input.discovery);
    if (input.discoveryVersion !== discovery.VERSION) discoveryErrors.push('The questionnaire has changed. Reload and review your answers.');
    if (!result.valid) discoveryErrors.push('Complete the discovery questions before submitting.');
    if (result.valid) {
      // Do not trust client-supplied recommendations, pricing, tier or entitlement fields.
      inquiry.projectType = result.name;
      inquiry.timeline = result.answers.timeline;
      inquiry.message = result.challenge + '\nDesired outcome: ' + result.outcome;
      inquiry.details = {
        'Rules version': discovery.VERSION,
        'Discovery answers': JSON.stringify(result.answers),
        'Recommended capability': result.capability,
        'Proposed scope': result.scope.join('; '),
        'Recommended product': result.productId || 'None (SENZ service)',
        'Suggested tier': result.suggestedTier,
        'Plan options': result.tiers.join('; '),
        'Recommendation reasons': result.why.join('; '),
        'Information to confirm': result.informationGaps.join('; '),
        'Human review': result.humanReviewRequired ? 'Required' : 'Scope confirmation required',
        'Quote status': 'New inquiry; no price or entitlement granted'
      };
    }
  }
  const assignedAgent = recommendAgent(inquiry);
  inquiry.assignedAgent = {
    id: assignedAgent.id,
    name: assignedAgent.name,
    label: assignedAgent.label,
    focus: assignedAgent.focus
  };

  const errors = [...discoveryErrors];
  if (!inquiry.consent.reply) errors.push("Agree to the privacy notice so SENZ can reply to this inquiry.");
  if (!inquiry.name) errors.push("Name is required.");
  if (inquiry.email && !isEmail(inquiry.email)) errors.push("Email must be valid when provided.");
  if (!inquiry.email && !inquiry.contact) errors.push("Email or phone/Messenger contact is required.");
  if (!inquiry.projectType) errors.push("Project type is required.");
  if (!inquiry.message) errors.push("Project goal is required.");

  return {
    inquiry,
    errors,
    spamTrap: clean(input.senzWebsite, 180),
    formStartedAt: Number(input.formStartedAt || 0)
  };
}

function inquirySubject(inquiry) {
  if (inquiry.formType === "consultation") {
    return `New SENZ consultation request — ${inquiry.name}`;
  }
  if (inquiry.formType === "creative-pool") {
    return `New SENZ creative network submission — ${inquiry.name}`;
  }
  return `New SENZ website inquiry — ${inquiry.name}`;
}

async function deliverInquiry(inquiry) {
  if (!inquiryDeliveryEndpoint) {
    const error = new Error("Inquiry email delivery is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deliveryTimeoutMs);
  const details = Object.fromEntries(
    Object.entries(inquiry.details).map(([key, value]) => [`Detail — ${key}`, value])
  );

  try {
    const response = await fetch(inquiryDeliveryEndpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        _subject: inquirySubject(inquiry),
        _template: "table",
        _captcha: "false",
        _replyto: inquiry.email,
        "Submission ID": inquiry.id,
        "Submission type": inquiry.formType,
        "Received at": inquiry.createdAt,
        "Name": inquiry.name,
        "Email": inquiry.email,
        "Phone or Messenger": inquiry.contact,
        "Business or organization": inquiry.brand,
        "Project type": inquiry.projectType,
        "Preferred schedule or timeline": inquiry.timeline,
        "Budget": inquiry.budget,
        "Message": inquiry.message,
        "Recommended SENZ route": inquiry.assignedAgent.label,
        "Consent to reply": `Yes (${inquiry.consent.version})`,
        "Marketing consent": inquiry.consent.marketing ? "Yes: may receive SENZ updates until they ask to stop" : "No: reply to this inquiry only",
        ...details
      }),
      signal: controller.signal
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || ![true, "true"].includes(result.success)) {
      const error = new Error("The inquiry email provider did not accept the submission.");
      error.statusCode = 502;
      throw error;
    }
  } catch (reason) {
    if (reason?.name === "AbortError") {
      const error = new Error("Inquiry email delivery timed out.");
      error.statusCode = 504;
      throw error;
    }
    throw reason;
  } finally {
    clearTimeout(timeout);
  }
}

function wasSubmittedTooQuickly(formStartedAt) {
  if (!Number.isFinite(formStartedAt) || formStartedAt <= 0) return false;
  const elapsed = Date.now() - formStartedAt;
  return elapsed >= 0 && elapsed < 1200;
}

async function handleInquiry(req, res) {
  try {
    if (!isAllowedOrigin(req)) {
      sendJson(req, res, 403, { ok: false, errors: ["Origin is not allowed."] });
      return;
    }

    const input = await readJsonBody(req);
    const { inquiry, errors, spamTrap, formStartedAt } = buildInquiry(input);

    // The hidden field first: automated submissions get the same answer whatever else they sent.
    if (spamTrap) {
      sendJson(req, res, 201, {
        ok: true,
        message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
      });
      return;
    }

    if (errors.length) {
      sendJson(req, res, 422, { ok: false, errors });
      return;
    }

    if (wasSubmittedTooQuickly(formStartedAt)) {
      sendJson(req, res, 429, {
        ok: false,
        errors: ["Please wait a moment, then submit the form again."]
      });
      return;
    }

    await deliverInquiry(inquiry);
    sendJson(req, res, 201, {
      ok: true,
      id: inquiry.id,
      assignedAgent: inquiry.assignedAgent,
      message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
    });
  } catch (error) {
    sendJson(req, res, error.statusCode || 500, {
      ok: false,
      errors: ["Unable to deliver the inquiry. Please email info.senz.pr@gmail.com directly."]
    });
  }
}

async function handleAgentRecommendation(req, res) {
  try {
    const input = await readJsonBody(req);
    const agent = recommendAgent(input);
    sendJson(req, res, 200, {
      ok: true,
      agent: {
        id: agent.id,
        name: agent.name,
        label: agent.label,
        focus: agent.focus
      }
    });
  } catch (error) {
    sendJson(req, res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to recommend an agent."]
    });
  }
}

function safeStaticPath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(part => part.startsWith('.'))) return null;
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\//, '');
  // Only public website assets. Never serve Git history, environment, backend, tests or docs.
  const rootPublic = /^[a-z0-9-]+\.html$/.test(relative) || ['robots.txt','sitemap.xml','llms.txt','llms-full.txt'].includes(relative);
  const asset = /^(assets|components)\/[a-zA-Z0-9_./-]+\.(css|js|json|png|jpe?g|webp|svg|ico|mp3|mp4|woff2?)$/.test(relative);
  if (!rootPublic && !asset) return null;
  const full = path.resolve(rootDir, relative);
  return full.startsWith(rootDir + path.sep) ? full : null;
}

function redirectToCanonicalHost(req, res, url) {
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  if (!canonicalHost || !redirectHosts.has(host)) return false;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const location = `${proto}://${canonicalHost}${url.pathname}${url.search}`;
  res.writeHead(308, { Location: location, "Cache-Control": "public, max-age=3600" });
  res.end();
  return true;
}

async function serveStatic(req, res, pathname) {
  let filePath = safeStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    const actualPath = await fsp.realpath(filePath);
    if (!actualPath.startsWith(rootDir + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await fsp.readFile(path.join(rootDir, "index.html"), "utf8"));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (redirectToCanonicalHost(req, res, url)) {
    return;
  }

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(req)) {
      sendJson(req, res, 403, { ok: false, errors: ["Origin is not allowed."] });
      return;
    }
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(req, res, 200, {
      ok: true,
      service: "senz-inquiry-email",
      storage: "none",
      time: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/agents") {
    sendJson(req, res, 200, {
      ok: true,
      agents: agents.map(({ id, name, label, focus }) => ({ id, name, label, focus }))
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/agents/recommend") {
    await handleAgentRecommendation(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inquiries") {
    await handleInquiry(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res, url.pathname);
    return;
  }

  sendJson(req, res, 405, { ok: false, errors: ["Method not allowed."] });
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`SENZ Strategic Communications website backend running at http://127.0.0.1:${port}`);
  });
}

module.exports = {
  buildInquiry,
  deliverInquiry,
  inquirySubject,
  server,
  wasSubmittedTooQuickly,
  safeStaticPath
};
