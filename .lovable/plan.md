# Ambient Smoke Layer

A purely decorative, GPU-friendly mist that drifts up from the bottom of every page. Zero JS, no canvas, no libraries — just a few blurred divs animated with `transform` and `opacity`.

## Recommended approach

Three to four absolutely-positioned `div`s inside one `fixed` container. Each div is a soft radial-gradient blob with heavy `blur`, low opacity, and a long-duration keyframe that translates upward + slightly sideways while fading. Staggered `animation-delay` so the effect never "pulses" in sync.

Why this beats the alternatives:
- **No canvas / Three.js / tsparticles** → no main-thread cost, no extra JS bytes.
- **Only `transform` + `opacity` animate** → composited on the GPU, no layout/paint, won't affect scroll FPS.
- **No SVG file needed** → radial-gradient backgrounds keep it zero network cost.
- `will-change: transform, opacity` on the blobs, `pointer-events: none` on the container, `aria-hidden` for a11y.
- Respect `prefers-reduced-motion` → hide animation entirely for those users.

## Files

**New:** `src/components/effects/AmbientSmoke.tsx`
- A single component, no props.
- Container: `fixed inset-x-0 bottom-0 h-40 md:h-48 pointer-events-none overflow-hidden z-[5]` (below header z-50 and mobile footer z-50, above page content).
- On mobile, bumps its `bottom` so the bottom edge of the smoke sits ~64px up (just above the `h-16` `MobileFooterNav`). Done with Tailwind: `bottom-16 md:bottom-0`. Smoke rises from there, never overlapping footer text/icons.
- 3–4 blob divs with `bg-[radial-gradient(...)]`, `blur-2xl`/`blur-3xl`, opacities ~5–12%, staggered delays.
- Hidden on admin/checkout/auth routes via a `useLocation` guard (same pattern as `MobileFooterNav`).

**Edit:** `src/index.css`
- Add `@keyframes smoke-rise` (translateY + slight translateX + opacity fade, ~14s ease-out infinite).
- Add `.smoke-blob` utility with `will-change`.
- Wrap keyframe usage in `@media (prefers-reduced-motion: no-preference)` so reduced-motion users get a static, near-invisible layer (or nothing).

**Edit:** `src/App.tsx`
- Mount `<AmbientSmoke />` once at the app root so it persists across route changes.

## Visual spec
- Color: white/very light gray at 6–10% alpha on light theme. Uses `hsl(var(--foreground) / 0.05)` for a single subtle dark wisp so it reads on white too.
- 3 blobs, sizes ~`w-72 h-72`, `w-96 h-96`, `w-[28rem] h-[28rem]`, positioned across the bottom (`left-1/4`, `left-1/2`, `right-1/6`).
- Durations 12s / 16s / 20s, delays 0s / -6s / -11s so it starts mid-cycle and never feels "on/off".

## Mobile safety
- `MobileFooterNav` is `fixed bottom-0 h-16 z-50`.
- Smoke container is `z-[5]` and `bottom-16 md:bottom-0`, so the footer always sits visually on top and the smoke emerges from just above it — never under or across the icons.

## Performance budget
- 0 KB JS runtime cost beyond the component shell.
- 0 network requests.
- 4 composited layers, animated properties limited to `transform` + `opacity`.
- Disabled entirely under `prefers-reduced-motion`.

## Out of scope
- No interaction, no scroll-linked effects, no dynamic color theming.
- No new dependencies.
