const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");

let deliveryServer;
let deliveryUrl;
let apiServer;
let apiUrl;
const deliveries = [];
let providerReply = { success: true };

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

before(async () => {
  deliveryServer = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    deliveries.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(providerReply));
  });
  deliveryUrl = await listen(deliveryServer);

  process.env.SITE_ORIGIN = "https://www.senzpr.com,https://senzpr.com";
  process.env.SENZ_FORM_DELIVERY_ENDPOINT = deliveryUrl;
  ({ server: apiServer } = require("../server"));
  apiUrl = await listen(apiServer);
});

after(async () => {
  await close(apiServer);
  await close(deliveryServer);
});

test("health reports an email-only service with no storage", async () => {
  const response = await fetch(`${apiUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.service, "senz-inquiry-email");
  assert.equal(body.storage, "none");
});

test("invalid inquiries are rejected before delivery", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({ name: "Test Visitor" })
  });
  assert.equal(response.status, 422);
  assert.equal(deliveries.length, 0);
});

test("valid inquiries are delivered as email payloads", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      formType: "consultation",
      name: "Test Visitor",
      email: "visitor@example.com",
      projectType: "Website strategy",
      timeline: "2026-08-04 10:00",
      message: "A test project brief.",
      privacyConsent: true,
      fields: { preferredDate: "2026-08-04", preferredTime: "10:00" }
    })
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(deliveries.length, 1);
  assert.match(deliveries[0]._subject, /consultation request/i);
  assert.equal(deliveries[0]._replyto, "visitor@example.com");
  assert.equal(deliveries[0]["Detail — preferredDate"], "2026-08-04");
});

test("partner applications receive a distinct subject and preserve qualification details", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "https://www.senzpr.com" },
    body: JSON.stringify({
      formType: "partner",
      name: "Partner Applicant",
      email: "partner@example.com",
      brand: "Independent Studio",
      projectType: "SENZ Partner Program application",
      timeline: "Within 1–3 months",
      message: "I work with small businesses in Zambales.",
      privacyConsent: true,
      fields: { location: "Zambales", customerFocus: "Micro and small businesses" }
    })
  });
  assert.equal(response.status, 201);
  const delivered = deliveries.at(-1);
  assert.match(delivered._subject, /Partner Program application/i);
  assert.equal(delivered["Submission type"], "partner");
  assert.equal(delivered["Detail — location"], "Zambales");
});

test("unapproved browser origins are blocked", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://example.invalid"
    },
    body: JSON.stringify({
      name: "Blocked Visitor",
      email: "visitor@example.com",
      projectType: "General",
      message: "This should not be delivered."
    })
  });
  assert.equal(response.status, 403);
  assert.equal(deliveries.length, 2);
});

test("honeypot submissions return success without delivery", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      name: "Spam Bot",
      email: "bot@example.com",
      projectType: "General",
      message: "Automated spam.",
      senzWebsite: "https://spam.invalid",
      privacyConsent: true
    })
  });
  assert.equal(response.status, 201);
  assert.equal(deliveries.length, 2);
});

test("inquiries without privacy consent are rejected", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      name: "Test Visitor",
      email: "visitor@example.com",
      projectType: "General",
      message: "A brief without consent."
    })
  });
  assert.equal(response.status, 422);
  assert.equal(deliveries.length, 2);
});

test("consultation requests need a preferred date and time", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      formType: "consultation",
      name: "Test Visitor",
      email: "visitor@example.com",
      projectType: "Consultation",
      message: "Need a time.",
      privacyConsent: true,
      fields: { preferredDate: "2026-08-04" }
    })
  });
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.match(body.errors.join(" "), /Preferred time is required/);
  assert.equal(deliveries.length, 2);
});


const productRequest = { formType: 'product', productKey: 'qr-menu', seats: 2, name: 'Product QA', email: 'qa@example.com', message: 'A menu for our cafe', privacyConsent: true };
const postProduct = async (body) => fetch(`${apiUrl}/api/inquiries`, {method:'POST',headers:{'Content-Type':'application/json',Origin:'https://www.senzpr.com'},body:JSON.stringify(body)});
test('product requests use authoritative prices and preserve the chosen product', async () => {
  const res=await postProduct({...productRequest,budget:'PHP 1',fields:{monthlyTotalPhp:'1',seats:'100'}});
  assert.equal(res.status,201);
  const delivered=deliveries.at(-1);
  assert.equal(delivered['Detail — productKey'],'qr-menu');
  assert.equal(delivered['Detail — seats'],'2');
  assert.equal(delivered['Detail — monthlyTotalPhp'],'Quote required');
  assert.match(delivered.Budget,/Request a Quote/);
  assert.match(delivered._subject,/product request/);
});
test('invalid product, fractional seats and non-object payloads never reach delivery',async()=>{
 const before=deliveries.length;
 for(const body of [{...productRequest,productKey:'missing'},{...productRequest,seats:1.5},{...productRequest,seats:0},{...productRequest,seats:10001}])assert.equal((await postProduct(body)).status,422);
 assert.equal((await postProduct(null)).status,400);
 assert.equal(deliveries.length,before);
});
test('a provider HTTP 200 without acceptance is never reported as successful',async()=>{
 providerReply={message:'unconfirmed'};
 try {const res=await postProduct(productRequest);assert.equal(res.status,502);assert.equal((await res.json()).ok,false);}finally{providerReply={success:true};}
});
test('public server exposes pages and assets, not application source or credentials',async()=>{
 const font = await fetch(apiUrl+'/assets/fonts/montserrat-latin-wght-v31.woff2');
 assert.equal(font.status, 200);
 assert.equal(font.headers.get('content-type'), 'font/woff2');
 assert.equal(Buffer.from(await font.arrayBuffer()).toString('ascii', 0, 4), 'wOF2');
 assert.equal((await fetch(apiUrl+'/assets/fonts/Montserrat-OFL.txt')).status, 200);
 for(const path of ['/server.js','/package.json','/.env','/.git/config','/test/server.test.js','/components/%2e%2e/server.js'])assert.notEqual((await fetch(apiUrl+path)).status,200,path);
 for(const path of ['/','/purchase.html','/products/qr-menu.html','/components/purchase.js','/components/product-catalog.json','/robots.txt','/sitemap.xml'])assert.equal((await fetch(apiUrl+path)).status,200,path);
 const head=await fetch(apiUrl+'/purchase.html',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
});

test('removed products are rejected before any email delivery',async()=>{
 const before=deliveries.length;
 for(const productKey of ['fotolab','music-platform']){const res=await postProduct({...productRequest,productKey});assert.equal(res.status,422);}
 assert.equal(deliveries.length,before);
});

test("a missing address gets the SENZ not-found page with status 404", async () => {
  for (const missing of ["/no-such-page.html", "/products/fotolab.html", "/products/music-platform.html"]) {
    const response = await fetch(apiUrl + missing);
    assert.equal(response.status, 404, missing);
    const html = await response.text();
    assert.match(html, /This page is not here\./, missing);
    assert.match(html, /<base href="\/" \/>/, "links resolve from the site root at any address");
    assert.match(html, /<meta name="robots" content="noindex"/);
  }
});
