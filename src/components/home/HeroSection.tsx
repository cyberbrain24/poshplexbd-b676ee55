import { Helmet } from "react-helmet-async";
import { useSiteBranding } from "@/hooks/useSiteBranding";

const HeroSection = () => {
  const { data: branding, isLoading } = useSiteBranding();

  // While branding is loading, reserve the hero space so we don't shift
  // layout (CLS) the moment the banner image attaches.
  if (isLoading || !branding) {
    return (
      <section className="w-full">
        <div
          className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted"
          aria-hidden="true"
        />
      </section>
    );
  }

  if (!branding.hero_enabled) return null;

  const desktopBanner = branding.desktop_hero_url;
  const mobileBanner = branding.mobile_hero_url;
  const hasBanner = desktopBanner || mobileBanner;

  if (!hasBanner) return null;

  const desktopPreload = desktopBanner || mobileBanner;
  const mobilePreload = mobileBanner || desktopBanner;

  return (
    <>
      <Helmet>
        {desktopPreload && (
          <link
            rel="preload"
            as="image"
            href={desktopPreload}
            media="(min-width: 768px)"
            // @ts-ignore - valid HTML attribute
            fetchpriority="high"
          />
        )}
        {mobilePreload && (
          <link
            rel="preload"
            as="image"
            href={mobilePreload}
            media="(max-width: 767px)"
            // @ts-ignore - valid HTML attribute
            fetchpriority="high"
          />
        )}
      </Helmet>
      <section className="w-full">
        {/* aspect-ratio wrapper reserves layout space before <img> resolves */}
        <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted">
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
              className="w-full h-full object-cover block"
              style={{ imageRendering: "auto" }}
            />
          </picture>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
