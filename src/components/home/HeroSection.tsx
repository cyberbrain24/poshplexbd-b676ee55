import heroBannerDesktop from "@/assets/hero-banner-optimized.webp";
import heroBannerMobile from "@/assets/hero-banner-mobile.webp";

const HeroSection = () => {
  return (
    <section className="w-full !py-0">
      <picture>
        {/* Mobile: smaller file, 16:9 crop */}
        <source
          srcSet={heroBannerMobile}
          type="image/webp"
          media="(max-width: 768px)"
        />
        {/* Desktop: full width banner */}
        <source
          srcSet={heroBannerDesktop}
          type="image/webp"
        />
        <img
          src={heroBannerDesktop}
          alt="Poshplex streetwear collection"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-auto block"
          width={1920}
          height={817}
          style={{ aspectRatio: "2.35 / 1", objectFit: "cover" }}
        />
      </picture>
    </section>
  );
};

export default HeroSection;
