import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User, Music, Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

const MobileFooterNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { hasTracks, isPlaying, togglePlay, next, prev, currentTrack } = useMusicPlayer();
  const [musicOpen, setMusicOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Don't show on admin pages or checkout
  const hiddenPaths = ["/admin", "/checkout", "/auth"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    if (!musicOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setMusicOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [musicOpen]);

  if (shouldHide) {
    return null;
  }

  type NavLinkItem = { kind: "link"; icon: typeof Home; label: string; path: string; badge?: number };
  type NavMusicItem = { kind: "music"; label: string };

  const navItems: Array<NavLinkItem | NavMusicItem> = [
    { kind: "link", icon: Home, label: "Home", path: "/" },
    { kind: "link", icon: LayoutGrid, label: "Category", path: "/categories" },
    { kind: "music", label: "Music" },
    {
      kind: "link",
      icon: ShoppingBag,
      label: "Cart",
      path: "/checkout",
      badge: cartCount > 0 ? cartCount : undefined,
    },
    { kind: "link", icon: User, label: "Account", path: "/account" },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 lg:hidden" />

      {/* Fixed footer navigation - only visible on mobile/tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="flex items-end justify-around h-16 px-4 relative">
          {navItems.map((item, idx) => {
            if (item.kind === "music") {
              if (!hasTracks) {
                // Keep the slot empty to preserve spacing
                return <div key="music-empty" className="flex-1" />;
              }
              return (
                <div key="music" className="flex-1 flex flex-col items-center justify-end h-full py-2 relative">
                  <button
                    onClick={() => setMusicOpen((v) => !v)}
                    aria-label="Music player"
                    className={cn(
                      "-mt-6 h-12 w-12 rounded-full bg-foreground text-background",
                      "flex items-center justify-center shadow-[0_6px_20px_-4px_rgba(47,47,47,0.6)] ring-4 ring-background",
                      isPlaying && "animate-pulse"
                    )}
                  >
                    <Music className="h-5 w-5" strokeWidth={2} />
                  </button>
                  <span className="text-[10px] mt-1 font-light">Music</span>

                  {musicOpen && (
                    <div
                      ref={popoverRef}
                      className="absolute bottom-[72px] left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-xl p-3 w-[240px] z-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Now Playing
                        </span>
                        <button onClick={() => setMusicOpen(false)} aria-label="Close">
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      <p className="text-sm font-medium truncate mb-3">
                        {currentTrack?.title || "—"}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={prev}
                          aria-label="Previous"
                          className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <SkipBack className="h-4 w-4" />
                        </button>
                        <button
                          onClick={togglePlay}
                          aria-label={isPlaying ? "Pause" : "Play"}
                          className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </button>
                        <button
                          onClick={next}
                          aria-label="Next"
                          className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <SkipForward className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[10px] font-medium rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-light">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>
    </>
  );
};

export default MobileFooterNav;
