# Steadfast Courier Integration — Information & Theory Guide

This document explains how the Steadfast Courier service connects to the order management system, what information is exchanged, and how parcel tracking operates. No code or system architecture is included.

---

## 1. What Steadfast Courier Does

Steadfast Courier Ltd. is a third-party logistics provider in Bangladesh. It picks up parcels from the merchant, delivers them to customers, collects Cash on Delivery (COD) amounts when applicable, and reports delivery status back to the merchant.

In this project, Steadfast is used as the default courier for confirmed orders.

---

## 2. How an Order Becomes a Parcel

When an order is ready to ship, the system converts the order into a Steadfast consignment. This means the customer's delivery details and the amount to collect are sent to Steadfast so a delivery agent can be assigned.

The information sent includes:

- **Invoice number** — a unique reference taken from the order number.
- **Customer name** — the person who will receive the parcel.
- **Customer phone** — the primary contact number for delivery.
- **Delivery address** — the full address, including area and city.
- **Cash to collect (COD amount)** — the remaining amount the customer must pay on delivery. If the order is already paid, this is zero.
- **Item description** — a short summary of what is inside the parcel.
- **Delivery instructions** — any note the merchant wants the delivery agent to see.

The phone number must be exactly 11 digits starting with `01`. International formats like `+880` or `8801` are converted to the local `01` format before sending.

---

## 3. What Steadfast Returns

After a parcel is accepted, Steadfast provides:

- **Consignment ID** — Steadfast's internal reference number.
- **Tracking code** — the code customers can use to track the parcel.
- **Initial status** — usually "in_review", meaning the parcel is created and waiting for Steadfast to review it.

These values are saved back to the order record so the admin panel and customer tracking page can display them.

---

## 4. Parcel Status Meanings

Steadfast reports delivery status through pull-based checks. There is no automatic push notification. The system must ask Steadfast for the latest status.

Common status values and what they mean for the order:

| Steadfast Status | Meaning |
|---|---|
| **in_review** | The parcel is created but not yet reviewed by Steadfast. |
| **pending** | The parcel has been picked up or is in transit. |
| **hold** | The parcel is temporarily on hold. |
| **delivered_approval_pending** | Marked as delivered, waiting for merchant approval. |
| **partial_delivered_approval_pending** | Partially delivered, waiting for approval. |
| **cancelled_approval_pending** | Marked as cancelled, waiting for approval. |
| **delivered** | The parcel was fully delivered and COD was collected if applicable. |
| **partial_delivered** | Only part of the parcel was delivered. |
| **cancelled** | The parcel was returned or cancelled. |

These raw statuses are mapped to the project's internal order statuses so the admin dashboard shows a consistent view.

---

## 5. Tracking Methods

A parcel can be looked up using any of these identifiers:

- **Consignment ID** — Steadfast's internal ID.
- **Invoice** — the order number used when creating the parcel.
- **Tracking code** — the code shown to the customer.

The system can check one parcel at a time or sync many parcels in a batch.

---

## 6. Bulk Parcel Creation

Multiple orders can be sent to Steadfast at once, up to a few hundred per request. Each row in the batch is matched back to the corresponding order by invoice number. If one row fails, the others may still succeed.

Common reasons a row fails include:

- The invoice number was already used.
- The phone number is invalid.
- A required field is missing.

Successful rows receive a tracking code and consignment ID. Failed rows are reported with an error message and must be corrected and resent.

---

## 7. Returns and Remittance

### Returns
A return request can be created for a parcel that needs to be sent back. The merchant provides the consignment ID, invoice, or tracking code along with a reason.

### Payments
Steadfast collects COD amounts from customers and later reports the collected money as remittance entries. The merchant can view these entries to reconcile how much COD has been collected and paid out.

---

## 8. Operational Rules

- **Invoice uniqueness:** Steadfast does not allow the same invoice number to be used twice. If an order must be re-shipped, the invoice must be changed or the old consignment must be removed from Steadfast first.
- **COD amount:** The cash to collect must be the remaining unpaid amount only. If the customer already paid part of the order, that paid amount is subtracted.
- **Phone validation:** The most common failure is an incorrectly formatted phone number. It must be normalized to 11 digits starting with `01` before sending.
- **No automatic updates:** Steadfast does not push status changes. The system must poll for updates on a schedule or when an admin requests a sync.
- **Check balance first:** A balance check is the simplest way to confirm that the API credentials are working before trying to create a parcel.
- **Log payloads:** Keeping a record of what was sent (without the API keys) helps when contacting Steadfast support.

---

## 9. Security Principles

- API keys are stored only on the server side.
- The browser never talks directly to Steadfast.
- Only admin users can trigger courier actions.
- Requests are rate-limited and restricted to allowed domains.

---

## 10. Data Stored in the Order Record

After a parcel is created, the order record keeps:

- Tracking number
- Steadfast consignment ID
- Courier name
- Delivered timestamp

An order status history log is also maintained so every status change can be audited later.

---

## 11. Credentials

Two credentials are required:

- **API Key**
- **Secret Key**

These are obtained from the Steadfast merchant portal. For a new project, it is recommended to generate a fresh key pair so each website can be disabled independently if needed.

The base API endpoint used by Steadfast is `https://portal.packzy.com/api/v1`.
