import { Helmet } from "react-helmet-async";
import { useSiteBranding } from "@/hooks/useSiteBranding";

// Use original URL directly — Supabase image transform API requires paid plan
const toWebP = (url: string | null | undefined, _width?: number): string | null => {
  if (!url) return null;
  return url;
};

const HeroSection = () => {
  const { data: branding } = useSiteBranding();

  if (branding && !branding.hero_enabled) return null;

  const desktopBanner = branding?.desktop_hero_url;
  const mobileBanner = branding?.mobile_hero_url;

  // Reserve space even while branding is loading to prevent CLS
  const hasBanner = desktopBanner || mobileBanner;

  if (branding && !hasBanner) return null;

  // Build the preload URL for the LCP image (desktop banner takes priority)
  const lcpPreloadUrl = desktopBanner ? toWebP(desktopBanner, 1335) || desktopBanner : null;

  return (
    <>
      {/* Inject a preload hint as soon as the URL is known so the browser
          fetches the LCP image earlier in the waterfall */}
      {lcpPreloadUrl && (
        <Helmet>
          <link
            rel="preload"
            as="image"
            href={lcpPreloadUrl}
            fetchPriority="high"
          />
        </Helmet>
      )}
      <section className="w-full">
        {/* Reserve space while images load to prevent layout shift */}
        {!hasBanner && (
          <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted animate-pulse" aria-hidden="true" />
        )}
        {desktopBanner && (
          <img
            src={toWebP(desktopBanner, 1335) || desktopBanner}
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
            src={toWebP(mobileBanner, 390) || mobileBanner}
            alt="Hero banner"
            loading="eager"
            fetchPriority="high"
            width="390"
            height="520"
            className={`w-full h-auto block ${desktopBanner ? 'md:hidden' : ''}`}
          />
        )}
      </section>
    </>
  );
};

export default HeroSection;
