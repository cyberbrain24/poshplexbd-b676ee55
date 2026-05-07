import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Music, Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

const FloatingMusicPlayer = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { hasTracks, isPlaying, togglePlay, next, prev, currentTrack } = useMusicPlayer();

  // Hide on admin routes
  if (location.pathname.startsWith("/admin")) return null;
  if (!hasTracks) return null;

  return (
    <div className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Music player"
        className={cn(
          "h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-foreground text-background shadow-lg",
          "flex items-center justify-center hover:scale-105 transition-transform",
          isPlaying && "animate-pulse"
        )}
      >
        <Music className="h-5 w-5" />
      </button>

      {open && (
        <div className="bg-background border border-border rounded-lg shadow-xl p-3 w-[220px] sm:w-[260px] animate-in fade-in slide-in-from-left-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Now Playing
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close">
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
};

export default FloatingMusicPlayer;
