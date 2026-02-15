import heroBannerWebp from "@/assets/hero-banner.webp";
import heroBannerPng from "@/assets/hero-banner.png";

const HeroSection = () => {
  return (
    <section className="w-full !py-0">
      <picture>
        <source srcSet={heroBannerWebp} type="image/webp" />
        <img
          src={heroBannerPng}
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
