---
title: Currency & Locations
category: Conventions
order: 40
updated: 2026-06-10
---

# Currency & Locations

## Currency

- All amounts are Taka (BDT), symbol `৳`.
- Use the helpers in `src/lib/currency.ts`:

```ts
import { formatCurrency, formatCurrencyWithSign, parseCurrency } from "@/lib/currency";

formatCurrency(1234.5);           // "৳1,234.5"
formatCurrencyWithSign(-200);     // "-৳200"
parseCurrency("৳1,234.50");       // 1234.5
```

- Locale: `en-BD`. Never use generic `Intl` formatters without specifying this locale.

## Locations

The hierarchy is **Districts → Thanas** (called "Districts/Thanas" in UI, never "Cities" or "Areas"). Shipping rates are computed per thana via the dynamic shipping engine in `src/config/shippingConfig.ts`.

Tables: `divisions` (districts) and `thanas`. Each customer / order references a `division_id` and `thana_id`.

## Phone-as-email

Phone numbers map to shadow emails: `<digits>@phone.local`. This is the bridge that lets phone-based auth use the standard email/password flow. Always normalize phone digits before saving.
