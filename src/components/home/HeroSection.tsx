import { useSiteBranding } from "@/hooks/useSiteBranding";

const HeroSection = () => {
  const { data: branding } = useSiteBranding();

  if (branding && !branding.hero_enabled) return null;

  const desktopBanner = branding?.desktop_hero_url;
  const mobileBanner = branding?.mobile_hero_url;

  if (!desktopBanner && !mobileBanner) return null;

  return (
    <section className="w-full leading-[0]">
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="Hero banner"
          loading="eager"
          fetchPriority="high"
          className={`w-full h-auto block ${mobileBanner ? 'hidden md:block' : ''}`}
        />
      )}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="Hero banner"
          loading="eager"
          fetchPriority="high"
          className={`w-full h-auto block ${desktopBanner ? 'md:hidden' : ''}`}
        />
      )}
    </section>
  );
};

export default HeroSection;
