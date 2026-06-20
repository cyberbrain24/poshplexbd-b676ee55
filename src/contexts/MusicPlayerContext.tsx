import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MusicTrack {
  id: string;
  title: string;
  file_url: string;
}

interface MusicPlayerContextValue {
  tracks: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  hasTracks: boolean;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export const useMusicPlayer = () => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
};

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const hasInteractedRef = useRef(false);

  // Lazily create the persistent audio element. Don't preload audio data —
  // the file is several MB and was hurting LCP on every page.
  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "none";
  }

  // Load tracks from DB and start at a random track
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("music_tracks")
        .select("id,title,file_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (mounted && data && data.length) {
        setTracks(data as MusicTrack[]);
        setCurrentIndex(Math.floor(Math.random() * data.length));
      }
    })();
    return () => { mounted = false; };
  }, []);

  const currentTrack = tracks[currentIndex] || null;

  // Update audio src when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.src !== currentTrack.file_url) {
      audio.src = currentTrack.file_url;
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying]);

  // Pick a random different track (shuffle)
  const pickRandom = useCallback((len: number, exclude: number) => {
    if (len <= 1) return 0;
    let n = Math.floor(Math.random() * len);
    if (n === exclude) n = (n + 1) % len;
    return n;
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((i) => (tracks.length ? pickRandom(tracks.length, i) : 0));
  }, [tracks.length, pickRandom]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (tracks.length ? pickRandom(tracks.length, i) : 0));
  }, [tracks.length, pickRandom]);

  // Auto-advance on end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => next();
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [next]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  return (
    <MusicPlayerContext.Provider
      value={{
        tracks,
        currentIndex,
        isPlaying,
        currentTrack,
        togglePlay,
        next,
        prev,
        hasTracks: tracks.length > 0,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};
