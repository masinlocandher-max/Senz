# SENZ Backend

This folder now includes a small Node backend for the website.

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://127.0.0.1:4177
```

## Endpoints

- `GET /api/health` checks the backend status.
- `GET /api/agents` lists the SENZ routing agents.
- `POST /api/agents/recommend` recommends an agent for a draft inquiry.
- `POST /api/inquiries` receives the Get Started intake form.
- `GET /api/inquiries` lists saved inquiries only when `ADMIN_TOKEN` is set and sent as `Authorization: Bearer <token>`.

## Agents

Every inquiry is automatically routed to a SENZ agent profile such as Brand Direction, Public Relations, Creative Production, Digital Products, Events Platform, or Founder Review. The assigned agent is stored with the inquiry and returned to the form after submission.

## Storage

Inquiries are saved to:

```text
data/inquiries.jsonl
```

That file is intentionally ignored by Git so private client leads are not uploaded publicly.
