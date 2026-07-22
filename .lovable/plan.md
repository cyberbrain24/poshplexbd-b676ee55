## Changes

### 1. Delete the `/categories` page entirely
- Delete file `src/pages/CategoryBrowser.tsx`.
- Remove its lazy import and `<Route path="/categories">` from `src/apps/storefront/StorefrontRoutes.tsx`.
- Remove any lingering `/categories` references (e.g. prefetch hints in `src/hooks/useStorefrontPrefetch.ts` and `src/lib/adminRoutePrefetch.ts` if present).
- No database tables back this page (it just reads existing `categories`), so no migration required.

### 2. Mobile footer "Category" icon opens the hamburger popup instead
- In `src/components/navigation/MobileFooterNav.tsx`, change the Category item from a `<Link to="/categories">` into a `<button>` that dispatches a new `window` event `open-mobile-menu`.
- In `src/components/header/PoshplexHeader.tsx`, add a `useEffect` that listens for `open-mobile-menu` and sets `setIsMobileMenuOpen(true)` — reusing the exact same `MobileMenu` component already rendered there (same popup, identical behavior).

### 3. Move Wishlist (Heart) off the mobile top header
- In `src/components/header/PoshplexHeader.tsx`, hide the Heart/Favorites link on mobile by adding `hidden lg:flex` (or `lg:relative` wrapper). Keep it visible on desktop.
- The mobile footer already has a Favorites (Heart) entry in the middle slot (position 3 of 5: Home, Category, **Favorites**, Cart, Account) — no reorder needed.

## Technical notes
- Communication between `MobileFooterNav` and `PoshplexHeader` uses the same `window.dispatchEvent` pattern already used for `open-shopping-bag`, so no context/prop plumbing needed.
- No database or edge function changes.

## Files touched
- Delete: `src/pages/CategoryBrowser.tsx`
- Edit: `src/apps/storefront/StorefrontRoutes.tsx`, `src/components/navigation/MobileFooterNav.tsx`, `src/components/header/PoshplexHeader.tsx`
- Possibly edit (if `/categories` referenced): prefetch hooks
