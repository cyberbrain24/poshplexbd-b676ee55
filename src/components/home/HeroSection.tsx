import heroBanner from "@/assets/hero-banner.png";

const HeroSection = () => {
  return (
    <section className="w-full !py-0">
      <img
        src={heroBanner}
        alt="Poshplex streetwear collection"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="w-full h-auto block"
        style={{ aspectRatio: "2.35 / 1", objectFit: "cover" }}
      />
    </section>
  );
};

export default HeroSection;
