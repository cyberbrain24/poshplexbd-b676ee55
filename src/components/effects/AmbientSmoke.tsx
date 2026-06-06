import { useLocation } from "react-router-dom";

/**
 * AmbientSmoke — purely decorative, GPU-only mist drifting up from the
 * bottom of the viewport. Zero JS animation, no canvas, no libraries.
 * Animates only transform + opacity (composited layers).
 */
const AmbientSmoke = () => {
  const { pathname } = useLocation();

  const hiddenPrefixes = ["/admin", "/checkout", "/auth"];
  if (hiddenPrefixes.some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-16 md:bottom-0 h-40 md:h-48 overflow-hidden z-[5]"
    >
      <span
        className="smoke-blob absolute -bottom-16 left-[15%] h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.08), transparent 70%)",
          animation: "smoke-rise 14s ease-out infinite",
          animationDelay: "0s",
        }}
      />
      <span
        className="smoke-blob absolute -bottom-20 left-[45%] h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.06), transparent 70%)",
          animation: "smoke-rise 18s ease-out infinite",
          animationDelay: "-6s",
        }}
      />
      <span
        className="smoke-blob absolute -bottom-24 right-[10%] h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.05), transparent 70%)",
          animation: "smoke-rise 22s ease-out infinite",
          animationDelay: "-11s",
        }}
      />
    </div>
  );
};

export default AmbientSmoke;
