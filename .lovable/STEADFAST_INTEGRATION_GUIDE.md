# Steadfast Courier Integration — Implementation Guide

A complete, portable spec of how this project ships parcels through **Steadfast Courier Ltd.**
Everything below can be re-implemented on any stack (Node/Deno/PHP/Laravel/Next.js).

---

## 1. Architecture

```
Admin UI (React)
   │  supabase.functions.invoke("steadfast-courier?action=…")
   ▼
Edge Function  steadfast-courier   ← holds the API keys (never in the browser)
   │  fetch() with Api-Key / Secret-Key headers
   ▼
Steadfast API  https://portal.packzy.com/api/v1
   │
   └── response → writes tracking_number / consignment_id / order_status back to `orders`
```

Golden rule: **the API keys must live server-side only** (edge function / backend env).
The browser only calls your own backend endpoint.

---

## 2. Credentials

| Env var | Value | Where to get it |
|---|---|---|
| `STEADFAST_API_KEY` | your merchant Api-Key | Steadfast merchant portal → https://steadfast.com.bd/user/login → **API / Developer** section |
| `STEADFAST_SECRET_KEY` | matching Secret-Key | same page |

Both are stored as **backend secrets** in this project (Cloud → Secrets). The values are
write-only — they are not readable from code, chat, or the dashboard once saved. To reuse them
in another project, copy them from the Steadfast merchant portal (or generate a new key pair
there for the new site — recommended, so each site can be revoked independently).

Base URL: `https://portal.packzy.com/api/v1`

Required headers on **every** call:

```http
Api-Key: <STEADFAST_API_KEY>
Secret-Key: <STEADFAST_SECRET_KEY>
Content-Type: application/json
```

---

## 3. Minimal server helper

```ts
const BASE = "https://portal.packzy.com/api/v1";

async function steadfast(endpoint: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      "Api-Key": process.env.STEADFAST_API_KEY!,
      "Secret-Key": process.env.STEADFAST_SECRET_KEY!,
      "Content-Type": "application/json",
    },
    ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json() };
}
```

---

## 4. Sending a parcel (single order)

`POST /create_order`

### Payload

| Field | Type | Required | Notes |
|---|---|---|---|
| `invoice` | string | ✅ | Must be **unique per merchant**. We send `order_number` (e.g. `PO-1737…`). Re-sending the same invoice = duplicate error. |
| `recipient_name` | string | ✅ | max ~100 chars |
| `recipient_phone` | string | ✅ | **exactly 11 digits, starts with `01`** |
| `recipient_address` | string | ✅ | full address; we append `Thana: X, District: Y` |
| `cod_amount` | number | ✅ | Cash to collect. `0` for prepaid. **`total_amount − paid_amount`** |
| `recipient_city` | string | ◻ | District name |
| `recipient_area` | string | ◻ | Thana name |
| `note` | string | ◻ | delivery instructions |
| `item_description` | string | ◻ | `"Tee x2 (SKU-AB12), Cap x1"` |
| `alternative_phone` | string | ◻ | |
| `recipient_email` | string | ◻ | |
| `delivery_type` | number | ◻ | `0` = home delivery (default), `1` = point/hub pickup |

### Phone normalisation (mandatory — most failures come from here)

```ts
function formatPhone(p: string) {
  let c = (p || "").replace(/\D/g, "");     // strip +, spaces, dashes
  if (c.startsWith("88") && c.length === 13) c = c.slice(2);  // 8801… → 01…
  if (c.length === 10 && !c.startsWith("0")) c = "0" + c;     // 1712… → 01712…
  return c;  // valid only if length === 11 && startsWith("01")
}
```
Reject the order **before** hitting the API if the result isn't 11 digits starting with `01`.

### Example request

```json
{
  "invoice": "PO-1737654321",
  "recipient_name": "Rakib Hasan",
  "recipient_phone": "01712345678",
  "recipient_address": "House 12, Road 4, Banani, Thana: Banani, District: Dhaka",
  "recipient_city": "Dhaka",
  "recipient_area": "Banani",
  "cod_amount": 1450,
  "item_description": "Oversized Tee x1 (SKU-9F2A)",
  "note": "Call before delivery",
  "delivery_type": 0
}
```

### Success response

```json
{
  "status": 200,
  "message": "Consignment has been created successfully.",
  "consignment": {
    "consignment_id": 1424107,
    "invoice": "PO-1737654321",
    "tracking_code": "15Y0CQ8A",
    "recipient_name": "Rakib Hasan",
    "recipient_phone": "01712345678",
    "recipient_address": "House 12 …",
    "cod_amount": 1450,
    "status": "in_review",
    "note": "Call before delivery",
    "created_at": "2026-08-15T11:20:00.000000Z",
    "updated_at": "2026-08-15T11:20:00.000000Z"
  }
}
```

### What to persist after success

```sql
UPDATE orders SET
  tracking_number = :tracking_code,
  consignment_id  = :consignment_id::text,
  courier_name    = 'Steadfast',
  order_status    = 'confirmed'
WHERE id = :order_id;
```

### Validation errors

```json
{ "status": 400, "errors": { "recipient_phone": ["The recipient phone must be 11 characters."] } }
```
Surface `errors` field-by-field to the admin; do **not** mark the order as shipped.

---

## 5. Bulk parcels (up to 500 per call)

`POST /create_order/bulk-order`

Body is a **JSON string** inside a `data` key:

```json
{ "data": "[{\"invoice\":\"PO-1\",\"recipient_name\":\"…\",\"recipient_phone\":\"017…\",\"recipient_address\":\"…\",\"cod_amount\":0}, …]" }
```

Response is an **array**, one entry per row:

```json
[
  { "invoice": "PO-1", "recipient_name": "…", "status": "success",
    "consignment_id": 1424108, "tracking_code": "15Y0CQ8B" },
  { "invoice": "PO-2", "status": "error", "message": "Invoice already used" }
]
```
Match rows back to your orders by `invoice`, then write tracking data only for `status === "success"`.

---

## 6. Tracking / status

| Purpose | Endpoint |
|---|---|
| By consignment id | `GET /status_by_cid/{consignment_id}` |
| By invoice | `GET /status_by_invoice/{invoice}` |
| By tracking code | `GET /status_by_trackingcode/{tracking_code}` |

Response: `{ "status": 200, "delivery_status": "delivered" }`

### Steadfast `delivery_status` values → your order status

| Steadfast | Meaning | Map to |
|---|---|---|
| `pending` | picked up / in transit | `shipped` |
| `in_review` | consignment created, awaiting review | `confirmed` |
| `hold` | on hold | `confirmed` |
| `delivered_approval_pending` | delivered, awaiting merchant approval | `processing` |
| `partial_delivered_approval_pending` | partial, awaiting approval | `processing` |
| `cancelled_approval_pending` | cancel, awaiting approval | `processing` |
| `unknown_approval_pending` | unknown, awaiting approval | `processing` |
| `delivered` | fully delivered, COD collected | `delivered` (+ set `delivered_at`) |
| `partial_delivered` | partially delivered | `partially_delivered` |
| `cancelled` | returned to merchant | `cancelled` |

Steadfast has **no webhook** — status is **pull-based**. Implement a "Sync Status" action that
loops selected orders, calls `status_by_cid`, maps the value, updates `orders`, and appends a row
to `order_status_history` with note `Synced from Steadfast: <raw status>`. Run it on admin demand
and/or a scheduled job every 30–60 minutes.

---

## 7. Other endpoints used

| Action | Method + endpoint | Notes |
|---|---|---|
| Balance / credential health-check | `GET /get_balance` | returns `{ status, current_balance }` — perfect "Test Connection" ping |
| Districts & thanas | `GET /police_stations` | seed your District/Thana tables from this |
| Create return | `POST /create_return_request` | body: any of `consignment_id` / `invoice` / `tracking_code`, plus `reason` |
| Single return | `GET /get_return_request/{id}` | |
| All returns | `GET /get_return_requests` | |
| Payments (COD remittance) | `GET /payments` and `GET /payments/{id}` | reconcile collected COD |

---

## 8. Backend endpoint contract (copy this shape)

One function, `?action=` switch, admin-only:

```
POST /steadfast-courier?action=create_order          { order_id }
POST /steadfast-courier?action=bulk_create           { order_ids: [] }
GET  /steadfast-courier?action=track_by_consignment&consignment_id=…
GET  /steadfast-courier?action=track_by_invoice&invoice=…
GET  /steadfast-courier?action=track_by_tracking_code&tracking_code=…
GET  /steadfast-courier?action=get_balance
POST /steadfast-courier?action=sync_status           { order_id } | { order_ids: [] }
POST /steadfast-courier?action=create_return         { consignment_id|invoice|tracking_code, reason }
GET  /steadfast-courier?action=get_returns | get_return&return_id=…
GET  /steadfast-courier?action=get_payments | get_payment&payment_id=…
GET  /steadfast-courier?action=get_police_stations | sync_locations
POST /steadfast-courier?action=reset_shipping        { order_id }   // clears tracking so you can re-ship
```

Security layers applied before any Steadfast call:
1. `Authorization: Bearer <jwt>` required → 401 if absent/invalid.
2. Caller must have `admin` in the `user_roles` table → 403 otherwise.
3. Per-IP rate limiter.
4. CORS allowlist of your own domains.

---

## 9. Required order/database columns

```sql
ALTER TABLE orders
  ADD COLUMN tracking_number text,      -- Steadfast tracking_code
  ADD COLUMN consignment_id  text,      -- Steadfast consignment_id (store as text)
  ADD COLUMN courier_name    text,      -- 'Steadfast'
  ADD COLUMN delivered_at    timestamptz;
```
Plus `order_status_history(order_id, status_type, new_status, notes, created_at)` for the audit trail.

---

## 10. Operational checklist / pitfalls

- **Invoice uniqueness** — Steadfast rejects a repeated `invoice`. If you must re-ship, either reset
  the shipping fields and use a suffixed invoice (`PO-123-R1`) or delete the consignment in the portal.
- **COD amount** — always `total − paid`, never the gross total, or you double-charge the customer.
- **Phone** — the #1 failure cause. Normalise and validate before sending.
- **No webhooks** — always poll. Never assume "created" means "shipped".
- **Idempotency** — check `orders.consignment_id IS NULL` before calling `create_order`.
- **Test with `get_balance` first** — if that fails, the keys are wrong; nothing else will work.
- **Log the payload** you send (minus keys) — Steadfast support asks for it when debugging.
