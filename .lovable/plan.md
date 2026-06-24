## Fix pixel integration issues

Three small, isolated fixes — no behavior changes to tracking accuracy, just removing dev warnings and double-fires.

### 1. React `fetchPriority` casing warning

React 18 doesn't recognize the camelCase `fetchPriority` prop and warns in dev. Switch to lowercase DOM attribute spread so it lands on the element correctly without the warning.

Files:
- `src/components/product/ProductImageGallery.tsx` (2 `<img>` tags)
- `src/components/home/FeaturedProducts.tsx`
- `src/components/home/ProductGrid.tsx`
- `src/components/ui/product-image.tsx`
- `src/components/category/ProductGrid.tsx` (`<link rel="preload">`)

Change pattern:
```tsx
fetchPriority={index === 0 ? "high" : "auto"}
```
to:
```tsx
{...{ fetchpriority: index === 0 ? "high" : "auto" }}
```

### 2. Double-fired `ViewContent` (StrictMode in dev)

In `src/pages/ProductDetail.tsx`, add a `useRef` latch keyed on `product.id` so `trackViewContent` only fires once per product even when StrictMode invokes the effect twice or the user navigates between variants of the same product.

```tsx
const firedFor = useRef<string | null>(null);
useEffect(() => {
  if (!product?.id || firedFor.current === product.id) return;
  firedFor.current = product.id;
  // existing requestIdleCallback fire …
}, [product?.id, product?.name, product?.base_price]);
```

### 3. Cosmetic `PageView` test-mode log noise

In `src/services/facebook-pixel.service.ts → trackPageView`, the call `safeFbq('track', 'PageView', undefined, { eventID })` causes the testMode console.log to print `undefined` for params. Pass an empty object instead so the dev log reads cleanly:

```ts
safeFbq('track', 'PageView', {}, { eventID: eventId });
```

Meta treats missing and empty params identically for PageView, so no tracking impact.

### Verification

- Reload `/product/argentina-fifa-edition-982258a3` on mobile viewport, confirm:
  - No `fetchPriority`/`fetchpriority` warning in console
  - Exactly one `[FB Pixel] track ViewContent …` log per page load
  - `[FB Pixel] track PageView {}` instead of `{_type: undefined, value: undefined}`
- CAPI request to `/functions/v1/meta-capi` continues to return `events_received: 1`.
