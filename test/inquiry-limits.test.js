const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");

// A script must not be able to flood the SENZ inbox: each address gets a few inquiries per ten
// minutes, and the whole site a fixed number per hour, whatever address a sender claims.

let deliveryServer;
let apiServer;
let apiUrl;
let delivered = 0;

const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));

before(async () => {
  deliveryServer = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      delivered += 1;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    });
  });
  process.env.SENZ_FORM_DELIVERY_ENDPOINT = await listen(deliveryServer);
  process.env.SENZ_INQUIRY_LIMIT_PER_ADDRESS = "3";
  process.env.SENZ_INQUIRY_LIMIT_PER_HOUR = "5";
  ({ server: apiServer } = require("../server"));
  apiUrl = await listen(apiServer);
});

after(() => {
  apiServer.close();
  deliveryServer.close();
});

const send = (address) => fetch(`${apiUrl}/api/inquiries`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(address ? { "X-Forwarded-For": `${address}, 10.0.0.1` } : {}) },
  body: JSON.stringify({
    formType: "general",
    name: "Visitor",
    email: "visitor@example.com",
    projectType: "General",
    message: "Hello there.",
    privacyConsent: true
  })
});

test("each address gets a few inquiries per ten minutes; the refusal says how to reach SENZ", async () => {
  for (let i = 0; i < 3; i += 1) assert.equal((await send("203.0.113.7")).status, 201);
  const refused = await send("203.0.113.7");
  assert.equal(refused.status, 429);
  assert.match((await refused.json()).errors.join(" "), /info\.senz\.pr@gmail\.com/);
  assert.equal(delivered, 3, "the refused inquiry is not emailed");
  assert.equal((await send("198.51.100.20")).status, 201, "another visitor is unaffected");
});

test("the whole site has an hourly limit, so changing the claimed address does not help", async () => {
  assert.equal((await send("192.0.2.55")).status, 201, "the fifth inquiry this hour");
  for (const address of ["192.0.2.56", "192.0.2.57", undefined]) assert.equal((await send(address)).status, 429);
  assert.equal(delivered, 5);
});
