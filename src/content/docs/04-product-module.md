---
title: Product Module (SKU, Variants, Attributes)
category: Modules
order: 11
updated: 2026-06-10
---

# Product Module

## IDs and SKUs

- Products use UUID primary keys.
- If a product or variant has no manual SKU, the system generates a 10-char identifier: `SKU-` + 6 hex characters.

## Multi-category

A product belongs to one or more categories via the `product_categories` junction table. A legacy `category_id` column is kept in sync for older queries.

## Variants

- `product_variants` rows model size / colour / material combinations with their own price, SKU, and images.
- Selection UI on the product page uses side-by-side `h-10` touch targets with redundant text labels hidden.
- Variant edits preserve database IDs to avoid breaking historical order items.

## Attributes

Reusable global attributes live on `product_attributes` (name) and `product_attribute_values` (values). They are linked to products through `product_applied_attributes` and `product_variant_attribute_values`. Admin manages them at `/admin/product-attributes`.

## Bulk upload

CSV import at `/admin/bulk-upload` maps columns to product fields, defaults missing base pricing to the lowest variant price, and auto-generates SKUs for blank rows.
