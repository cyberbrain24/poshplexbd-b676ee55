---
title: Orders, Inventory & Payment Module
category: Modules
order: 10
updated: 2026-06-10
---

# Orders, Inventory & Payment

## Orders

- Order numbers follow the format `PO-[number]`.
- Statuses: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `partially_delivered`, `returned`, `cancelled`, `failed`, `rto`.
- Payment statuses: `unpaid`, `pending_verification`, `paid`, `partially_paid`, `partially_refunded`, `refunded`, `failed`.
- Order tracking is decoupled from order status — couriers update tracking via the Steadfast integration without touching order workflow.

## Payments

Payments are stored on `order_payments` and reflect bidirectionally into the financial `accounts` ledger:

- When a payment is recorded against an order, a matching `transactions` row is inserted on the chosen account.
- Editing or deleting an order payment updates / reverses the linked transaction.

## Independent Inventory

The main `products` catalog does **not** track stock. Inventory lives in a standalone ledger (`inventory_entries` + `inventory_entry_items`) used for bulk in/out movements. This keeps the customer-facing catalog simple and lets the warehouse model deliveries, transfers, and damaged stock separately.

## Decoupling rationale

- Storefront performance: catalog queries don't join inventory.
- Operational clarity: warehouse staff can audit movements without affecting catalog visibility.
- Safer deletions: removing a product is blocked if it has linked orders or inventory entries.
