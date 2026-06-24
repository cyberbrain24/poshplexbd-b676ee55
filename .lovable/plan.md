
## Goal
Strip all CSS animations, transitions, and keyframe motion on mobile (viewport < 768px) so the storefront paints faster on phones. Desktop/tablet animations stay unchanged.

## Approach
Add a single global mobile-only CSS override in `src/index.css` that neutralizes:
- All `animation` properties (including Tailwind's `animate-*`, accordion, fade-in, slide-in, scale-in, announcement-slide, etc.)
- All CSS `transition` properties
- `will-change` hints (no longer useful without motion)

This is a one-place change — far safer than editing every component. It uses `!important` with the universal selector inside a `@media (max-width: 767px)` block so it overrides Tailwind utilities and Radix component animations alike.

## Specific changes

**`src/index.css`** — append at the end:

```css
/* Mobile performance: disable all motion under 768px */
@media (max-width: 767px) {
  *,
  *::before,
  *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    will-change: auto !important;
  }
}
```

The existing mobile rule that already disables `.announcement-text` animation stays (redundant but harmless).

## What this affects on mobile
- Announcement bar slide → static (already was)
- Accordion open/close → instant
- Sheet/Drawer/Dialog slide-in → instant
- Hover/focus transitions → instant (mobile has no hover anyway)
- Skeleton pulse, toast slide, mega menu fade → instant
- Any Tailwind `transition-*`, `duration-*`, `animate-*` utility → no-op

## What stays
- Desktop/tablet (≥768px): fully untouched
- JS-driven layout, IntersectionObserver lazy mounts, prefetching: untouched
- `prefers-reduced-motion` rules: untouched

## Out of scope
No component edits, no Tailwind config changes, no JS animation library removal.
