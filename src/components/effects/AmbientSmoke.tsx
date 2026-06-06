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
      className="pointer-events-none fixed inset-x-0 bottom-16 md:bottom-0 h-56 md:h-64 overflow-hidden z-[40]"
    >
      <span
        className="smoke-blob absolute -bottom-24 left-[10%] h-80 w-80 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.28), transparent 65%)",
          animation: "smoke-rise 14s ease-out infinite",
        }}
      />
      <span
        className="smoke-blob absolute -bottom-28 left-[40%] h-96 w-96 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.22), transparent 65%)",
          animation: "smoke-rise 18s ease-out infinite",
          animationDelay: "-6s",
        }}
      />
      <span
        className="smoke-blob absolute -bottom-32 right-[8%] h-[28rem] w-[28rem] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.20), transparent 65%)",
          animation: "smoke-rise 22s ease-out infinite",
          animationDelay: "-11s",
        }}
      />
      <span
        className="smoke-blob absolute -bottom-20 left-[65%] h-72 w-72 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle at center, hsl(var(--foreground) / 0.18), transparent 65%)",
          animation: "smoke-rise 16s ease-out infinite",
          animationDelay: "-3s",
        }}
      />
    </div>
  );
};

export default AmbientSmoke;
