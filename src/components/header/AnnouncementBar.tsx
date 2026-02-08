/**
 * AnnouncementBar - Lightweight, CSS-only animated banner
 * Uses pure CSS keyframe animation for smooth left-right oscillation
 * No JavaScript animation = zero runtime overhead
 */

const AnnouncementBar = () => {
  return (
    <div className="announcement-bar bg-foreground text-background overflow-hidden">
      <div className="announcement-text py-2 text-xs font-medium tracking-widest whitespace-nowrap">
        BE POSH WITH POSHPLEX
      </div>
    </div>
  );
};

export default AnnouncementBar;
