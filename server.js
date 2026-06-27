const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { agents, recommendAgent } = require("./agents");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const inquiryFile = path.join(dataDir, "inquiries.jsonl");
const ebookOrderFile = path.join(dataDir, "ebook-orders.jsonl");
const port = Number(process.env.PORT || 4177);
const siteOrigin = process.env.SITE_ORIGIN || "";
const adminToken = process.env.ADMIN_TOKEN || "";

const ebooks = [
  {
    id: "influence-through-clarity",
    title: "Influence Through Clarity",
    price: 1499,
    currency: "PHP",
    access: "locked"
  },
  {
    id: "public-image-playbook",
    title: "Public Image Playbook",
    price: 1999,
    currency: "PHP",
    access: "locked"
  },
  {
    id: "digital-presence-guide",
    title: "Digital Presence Guide",
    price: 1799,
    currency: "PHP",
    access: "locked"
  }
];

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

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders()
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders() {
  if (!siteOrigin) return {};
  return {
    "Access-Control-Allow-Origin": siteOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
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

function money(amount) {
  return Number.isFinite(amount) ? amount : 0;
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
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

function buildInquiry(input, req) {
  const inquiry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clean(input.name, 120),
    brand: clean(input.brand, 160),
    email: clean(input.email, 180).toLowerCase(),
    contact: clean(input.contact, 180),
    projectType: clean(input.projectType, 160),
    timeline: clean(input.timeline, 120),
    budget: clean(input.budget, 120),
    message: cleanLong(input.message, 3000),
    source: "website-intake",
    userAgent: clean(req.headers["user-agent"], 300),
    ip: clientIp(req)
  };
  const assignedAgent = recommendAgent(inquiry);
  inquiry.assignedAgent = {
    id: assignedAgent.id,
    name: assignedAgent.name,
    label: assignedAgent.label,
    focus: assignedAgent.focus
  };

  const errors = [];
  if (!inquiry.name) errors.push("Name is required.");
  if (!inquiry.email || !isEmail(inquiry.email)) errors.push("A valid email is required.");
  if (!inquiry.projectType) errors.push("Project type is required.");
  if (!inquiry.message) errors.push("Project goal is required.");

  return { inquiry, errors };
}

async function saveInquiry(inquiry) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.appendFile(inquiryFile, `${JSON.stringify(inquiry)}\n`, "utf8");
}

function buildEbookOrder(input, req) {
  const requestedItems = Array.isArray(input.items) ? input.items : [];
  const items = requestedItems
    .map((item) => {
      const ebook = ebooks.find((entry) => entry.id === clean(item.id, 120));
      if (!ebook) return null;
      const quantity = Math.max(1, Math.min(10, Number.parseInt(item.quantity, 10) || 1));
      return {
        id: ebook.id,
        title: ebook.title,
        quantity,
        unitPrice: ebook.price,
        currency: ebook.currency,
        lineTotal: ebook.price * quantity
      };
    })
    .filter(Boolean);

  const currency = items[0]?.currency || "PHP";
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const order = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "payment_review",
    accessStatus: "locked_until_payment_verified",
    buyer: {
      name: clean(input.name, 120),
      email: clean(input.email, 180).toLowerCase(),
      phone: clean(input.phone, 80),
      company: clean(input.company, 160),
      country: clean(input.country, 120)
    },
    payment: {
      method: clean(input.paymentMethod, 120),
      reference: clean(input.paymentReference, 180),
      payerName: clean(input.payerName, 120),
      notes: cleanLong(input.paymentNotes, 1000)
    },
    items,
    currency,
    subtotal: money(subtotal),
    source: "ebook-checkout",
    userAgent: clean(req.headers["user-agent"], 300),
    ip: clientIp(req)
  };

  const errors = [];
  if (!items.length) errors.push("Add at least one ebook to the cart.");
  if (!order.buyer.name) errors.push("Full name is required.");
  if (!order.buyer.email || !isEmail(order.buyer.email)) errors.push("A valid email is required.");
  if (!order.buyer.phone) errors.push("Phone or Messenger contact is required.");
  if (!order.payment.method) errors.push("Payment method is required.");
  if (!order.payment.reference) errors.push("Payment reference is required.");
  if (!order.payment.payerName) errors.push("Payer name is required.");

  return { order, errors };
}

async function saveEbookOrder(order) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.appendFile(ebookOrderFile, `${JSON.stringify(order)}\n`, "utf8");
}

async function handleInquiry(req, res) {
  try {
    const input = await readJsonBody(req);
    const { inquiry, errors } = buildInquiry(input, req);

    if (errors.length) {
      sendJson(res, 422, { ok: false, errors });
      return;
    }

    await saveInquiry(inquiry);
    sendJson(res, 201, {
      ok: true,
      id: inquiry.id,
      assignedAgent: inquiry.assignedAgent,
      message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to submit inquiry."]
    });
  }
}

async function handleEbookOrder(req, res) {
  try {
    const input = await readJsonBody(req);
    const { order, errors } = buildEbookOrder(input, req);

    if (errors.length) {
      sendJson(res, 422, { ok: false, errors });
      return;
    }

    await saveEbookOrder(order);
    sendJson(res, 201, {
      ok: true,
      id: order.id,
      status: order.status,
      accessStatus: order.accessStatus,
      message: "Order received. Ebook access remains locked until SENZ Strategic Communications verifies the payment, then access will be sent to the buyer email."
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to submit ebook order."]
    });
  }
}

async function handleEbookOrderList(req, res) {
  if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
    sendJson(res, 401, { ok: false, errors: ["Unauthorized."] });
    return;
  }

  try {
    const raw = await fsp.readFile(ebookOrderFile, "utf8").catch(() => "");
    const orders = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse();
    sendJson(res, 200, { ok: true, orders });
  } catch {
    sendJson(res, 500, { ok: false, errors: ["Unable to read ebook orders."] });
  }
}

async function handleAgentRecommendation(req, res) {
  try {
    const input = await readJsonBody(req);
    const agent = recommendAgent(input);
    sendJson(res, 200, {
      ok: true,
      agent: {
        id: agent.id,
        name: agent.name,
        label: agent.label,
        focus: agent.focus
      }
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to recommend an agent."]
    });
  }
}

async function handleInquiryList(req, res) {
  if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
    sendJson(res, 401, { ok: false, errors: ["Unauthorized."] });
    return;
  }

  try {
    const raw = await fsp.readFile(inquiryFile, "utf8").catch(() => "");
    const inquiries = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse();
    sendJson(res, 200, { ok: true, inquiries });
  } catch {
    sendJson(res, 500, { ok: false, errors: ["Unable to read inquiries."] });
  }
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, normalized === "/" ? "index.html" : normalized);
  if (!filePath.startsWith(rootDir)) return null;
  return filePath;
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
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await fsp.readFile(path.join(rootDir, "index.html"), "utf8"));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "senz-backend", time: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/agents") {
    sendJson(res, 200, {
      ok: true,
      agents: agents.map(({ id, name, label, focus }) => ({ id, name, label, focus }))
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ebooks") {
    sendJson(res, 200, { ok: true, ebooks });
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

  if (req.method === "GET" && url.pathname === "/api/inquiries") {
    await handleInquiryList(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/ebook-orders") {
    await handleEbookOrder(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ebook-orders") {
    await handleEbookOrderList(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res, url.pathname);
    return;
  }

  sendJson(res, 405, { ok: false, errors: ["Method not allowed."] });
});

server.listen(port, () => {
  console.log(`SENZ Strategic Communications website backend running at http://127.0.0.1:${port}`);
});
