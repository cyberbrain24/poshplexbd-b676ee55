import { useSiteBranding } from "@/hooks/useSiteBranding";

const HeroSection = () => {
  const { data: branding } = useSiteBranding();

  if (branding && !branding.hero_enabled) return null;

  const desktopBanner = branding?.desktop_hero_url;
  const mobileBanner = branding?.mobile_hero_url;

  const hasBanner = desktopBanner || mobileBanner;

  if (branding && !hasBanner) return null;

  return (
    <>
      <section className="w-full">
        {!hasBanner && (
          <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted animate-pulse" aria-hidden="true" />
        )}

        {hasBanner && (
          <picture>
            {desktopBanner && (
              <source media="(min-width: 768px)" srcSet={desktopBanner} />
            )}
            {mobileBanner && (
              <source media="(max-width: 767px)" srcSet={mobileBanner} />
            )}
            <img
              src={desktopBanner || mobileBanner || ""}
              alt="Hero banner"
              loading="eager"
              // @ts-ignore
              fetchpriority="high"
              decoding="async"
              className="w-full h-auto block"
              style={{ imageRendering: "auto" }}
            />
          </picture>
        )}
      </section>
    </>
  );
};

export default HeroSection;
