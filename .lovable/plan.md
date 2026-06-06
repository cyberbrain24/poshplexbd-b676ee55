## Product Page Reviews — Pagination + Fullscreen Image Viewer

### 1. Paginated reviews grid (`ProductDescription.tsx`)
- Show an initial batch of reviews based on viewport:
  - Desktop (lg+): 5 reviews (matches the 5-col grid → one row)
  - Mobile: 4 reviews (matches the 2-col grid → two rows)
- Add a `visibleCount` state, initialized via a `useIsMobile`-style check (4 mobile / 5 desktop).
- Below the grid, render a centered **"View More"** button when `reviews.length > visibleCount`.
  - Each click increases `visibleCount` by the same step (4 mobile / 5 desktop).
  - Button styled consistently with existing minimalist outline buttons (uppercase, tracking-wider, rounded-sm).
- When all reviews are shown, hide the button (optionally show a subtle "End of reviews" line — skipping unless requested).

### 2. Fullscreen photo lightbox
- Currently clicking a review card opens a small `Dialog` (`viewingReview`). Replace the image portion with a true fullscreen experience:
  - Add a new local `lightboxImage` state (string | null) OR reuse the existing `ImageZoom` component for visual consistency.
  - Clicking a review's hero image (or any image inside the review detail dialog) opens the fullscreen viewer with that image (and siblings from `review.images` for swipe/scroll).
- Fullscreen viewer behavior:
  - Covers entire viewport with `bg-black/95 backdrop-blur` overlay (z-50).
  - Image centered, `max-h-screen max-w-screen object-contain`.
  - **Highlighted close button** in top-right: larger hit area (h-11 w-11), high-contrast white circular background with black X icon, subtle shadow, hover scale. Visible on both desktop and mobile.
  - Clicking the dark area **outside the image** closes the viewer (stopPropagation on the image itself).
  - ESC key also closes.
  - Body scroll locked while open.
- Reuse logic pattern from existing `ImageZoom.tsx` but adapted (current ImageZoom uses a black close button on black bg — we'll improve contrast and isolate to a single image with optional gallery).

### 3. Files affected
- Edit: `src/components/product/ProductDescription.tsx` — pagination state + button, wire image clicks to lightbox.
- New: `src/components/product/ReviewLightbox.tsx` — fullscreen image viewer with highlighted close, outside-click-to-close, ESC handler.
- No DB / hook changes. No homepage / admin changes.

### Notes
- Keeps existing review-detail `Dialog` (title, content, rating, reviewer) — only the image opens fullscreen.
- Pagination step is consistent so the grid stays clean (multiples of row size).
