# Sync Steadfast Button — User Guide

## Where it is

The **Sync Steadfast** button appears at the top-right of the **Order Fulfillment** page (`/admin/orders`). It is a manual, one-click action used to refresh the delivery status of every order that has already been handed over to Steadfast Courier.

---

## What it does

When you press the button, the system asks Steadfast for the latest delivery status of all active shipped orders, then updates each matching order inside your admin panel.

It does **not** create new parcels. It only updates existing orders that already have a Steadfast tracking number or consignment ID.

---

## Which orders are synced

The system looks for orders that meet **all** of the following rules:

1. The order has a value in the **Tracking Number** or **Consignment ID** field.
2. The order is **not** already in a final state.

Orders in the following states are skipped automatically:

- `delivered`
- `cancelled`
- `returned`
- `rto`

In short: only orders that are still moving through Steadfast’s network get synced.

---

## How the sync runs

1. The page collects the IDs of every active shipped order.
2. If no active shipped order exists, a message appears: **“No active shipped orders to sync”**.
3. The IDs are sent in small batches to avoid timeouts.
4. For each batch, the system asks Steadfast for the current parcel status.
5. Each returned status is translated into your store’s internal order status.
6. The order record and the order status history are updated.
7. A final toast message tells you how many orders were updated, skipped, or failed.

---

## Parameters sent to Steadfast

For each order, the system sends one of these two identifiers to Steadfast:

| Priority | Parameter | Description |
|----------|-----------|-------------|
| 1st | `consignment_id` | Steadfast’s internal parcel ID, stored when the parcel was created. |
| 2nd | `tracking_number` | The tracking code returned by Steadfast, used only if consignment ID is missing. |

No customer address, phone, or product details are sent during a sync. The sync is purely a status lookup.

---

## Status mapping

Steadfast returns its own delivery statuses. The system converts each one into your store’s order status as shown below.

| Steadfast status | Your store status | Meaning |
|------------------|-------------------|---------|
| `in_review` | `confirmed` | Parcel is under review by Steadfast. |
| `hold` | `confirmed` | Parcel is on hold. |
| `pending` | `shipped` | Parcel is pending pickup / in transit. |
| `delivered_approval_pending` | `processing` | Delivered, waiting for admin approval. |
| `partial_delivered_approval_pending` | `processing` | Partial delivery, waiting for approval. |
| `cancelled_approval_pending` | `processing` | Cancelled, waiting for approval. |
| `unknown_approval_pending` | `processing` | Unknown result, waiting for approval. |
| `delivered` | `delivered` | Parcel delivered successfully. |
| `partial_delivered` | `partially_delivered` | Only part of the parcel was delivered. |
| `cancelled` | `cancelled` | Parcel cancelled. |
| Any other status | — | No change is made. |

When an order is mapped to `delivered`, the system also records the current date and time as the order’s **delivered at** timestamp.

---

## What gets updated in the database

For each order whose status changes:

- `order_status` is set to the mapped status.
- `delivered_at` is set if the mapped status is `delivered`.
- A new row is added to `order_status_history` with:
  - `status_type`: `order`
  - `new_status`: the mapped status
  - `notes`: the original Steadfast status, e.g. `Synced from Steadfast: delivered`

---

## Progress and result messages

While the sync is running, the button shows a spinner and a counter:

```
Syncing 12 / 45
```

After it finishes, you will see one or more of these messages:

| Message | Meaning |
|---------|---------|
| `X order(s) synced with Steadfast` | At least one order’s status was updated. |
| `No status changes (X skipped)` | All checked orders already had the latest status. |
| `X order(s) failed to sync` | One or more batches could not reach Steadfast. |
| `No active shipped orders to sync` | No order currently has a tracking/consignment ID in a non-final state. |
| `Failed to load orders for sync` | The page could not read the local order list. |

---

## When to use it

Use the **Sync Steadfast** button whenever you want to refresh delivery statuses, for example:

- After handing over parcels to Steadfast and you want to confirm they are in transit.
- In the morning, to update all pending deliveries at once.
- After receiving a delivery confirmation from Steadfast outside the system.

---

## Important notes

- The button is **manual**. It does not run automatically on a timer.
- It only syncs orders that were already shipped through Steadfast.
- Orders without a consignment ID or tracking number are skipped.
- Final-state orders are never re-checked.
- If Steadfast’s API is slow or down, the batch may fail and the failed count will be shown.
- Syncing does not change `payment_status`. It only updates the delivery / order status.
