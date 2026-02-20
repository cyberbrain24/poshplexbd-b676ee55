import { useSiteBranding } from "@/hooks/useSiteBranding";

const HeroSection = () => {
  const { data: branding } = useSiteBranding();

  if (branding && !branding.hero_enabled) return null;

  const desktopBanner = branding?.desktop_hero_url;
  const mobileBanner = branding?.mobile_hero_url;

  // Reserve space even while branding is loading to prevent CLS
  // Use a 3:1 aspect ratio placeholder (typical banner ratio)
  const hasBanner = desktopBanner || mobileBanner;

  if (branding && !hasBanner) return null;

  return (
    <section className="w-full">
      {/* Reserve space while images load to prevent layout shift */}
      {!hasBanner && (
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted animate-pulse" aria-hidden="true" />
      )}
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="Hero banner"
          loading="eager"
          fetchPriority="high"
          width="1335"
          height="451"
          className={`w-full h-auto block ${mobileBanner ? 'hidden md:block' : ''}`}
        />
      )}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="Hero banner"
          loading="eager"
          fetchPriority="high"
          width="390"
          height="520"
          className={`w-full h-auto block ${desktopBanner ? 'md:hidden' : ''}`}
        />
      )}
    </section>
  );
};

export default HeroSection;
