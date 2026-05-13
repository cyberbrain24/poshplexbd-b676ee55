import { Helmet } from "react-helmet-async";
import PoshplexHeader from "../../components/header/PoshplexHeader";
import PoshplexFooter from "../../components/footer/PoshplexFooter";
import AboutSidebar from "../../components/about/AboutSidebar";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Our Story — POSHPLEX | The Hossan Brothers</title>
        <meta name="description" content="The story of POSHPLEX: how brothers Imran and Sadman united in 2025 to build a premium Bangladeshi streetwear label rooted in family, craftsmanship, and global ambition." />
        <link rel="canonical" href="https://poshplexbd.com/pages/our-story" />
        <meta property="og:title" content="Our Story — POSHPLEX" />
        <meta property="og:description" content="How two brothers built POSHPLEX into a premium Bangladeshi streetwear brand grounded in passion, family, and craftsmanship." />
        <meta property="og:url" content="https://poshplexbd.com/pages/our-story" />
        <meta property="og:type" content="article" />
      </Helmet>
      <PoshplexHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          {/* Hero Header */}
          <header className="pr-6 py-16 border-b border-border">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground mb-3">POSHPLEX</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-foreground mb-4">
              Our Story
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              A journey of passion, family, and the pursuit of fashion that transcends borders.
            </p>
          </header>

          {/* Brand Story */}
          <section className="py-12 space-y-8 text-[15px]">
            <div className="space-y-6 text-muted-foreground leading-relaxed max-w-2xl">
              <p>
                In 2021, <span className="text-foreground font-medium">Imran</span> began his fashion journey by building a brand grounded in passion for premium quality and distinctive style. His focus was clear: create clothing that combined luxury with uniqueness, designed for those who seek more than just fashion — they want a statement.
              </p>
              <p>
                Inspired by his brother's vision, <span className="text-foreground font-medium">Sadman</span> started his street culture fashion brand in 2024, bringing fresh creativity and a bold perspective rooted in urban lifestyle. Though their approaches differed, both brothers shared an unwavering commitment to excellence, exclusivity, and craftsmanship.
              </p>
              <p>
                In 2025, Imran and Sadman united their talents and dreams to build <span className="text-foreground font-bold">POSHPLEX</span>, a premium fashion brand designed to stand out on the global stage. Every element of POSHPLEX — from the finest fabric selection to precision stitching, from sophisticated packaging to impeccable delivery — reflects a dedication to luxury and quality without compromise.
              </p>
              <p>
                POSHPLEX is more than a clothing label; it's a celebration of refined elegance, unique design, and international ambition. It's built for discerning customers worldwide who appreciate timeless style infused with modern sophistication and authenticity.
              </p>
              <p className="text-foreground font-medium italic">
                Together, the two brothers crafted POSHPLEX to embody their shared values — family, passion, and the pursuit of fashion that transcends borders.
              </p>
            </div>
          </section>

          {/* Mission Statement */}
          <section className="py-12 border-t border-border">
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-4 border-b border-border pb-2">Mission Statement</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              To craft premium, luxurious apparel that combines timeless elegance with unique design, delivering exceptional quality and sophistication to discerning customers across the world.
            </p>
          </section>

          {/* Core Brand Values */}
          <section className="py-12 border-t border-border">
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-8 border-b border-border pb-2">Core Brand Values</h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-2xl">
              {[
                { title: "Premium Quality", desc: "Only the finest materials and meticulous craftsmanship are used in every piece." },
                { title: "Unique Design", desc: "Bold yet elegant styles that stand apart from the ordinary." },
                { title: "Luxury Experience", desc: "From product to packaging and delivery, every detail reflects refinement." },
                { title: "Authenticity", desc: "Genuine passion and family heritage shape every creation." },
                { title: "Global Vision", desc: "Committed to reaching and inspiring an international audience with our distinct fashion identity." },
              ].map((v) => (
                <div key={v.title} className="space-y-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{v.title}</h3>
                  <p className="text-muted-foreground text-sm">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Team */}
          <section className="py-12 border-t border-border mb-8">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground mb-2">WORDS ABOUT US</p>
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3 border-b border-border pb-2">Our Team</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Driven by passion and precision, the POSHPLEX team blends creativity with craftsmanship to redefine luxury fashion.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
              {[
                { name: "MD. IMRAN HOSSAN", role: "Founder" },
                { name: "MD. SADMAN ISLAM", role: "Co-Founder" },
                { name: "MD. NIAZ KHAN", role: "Manager" },
              ].map((m) => (
                <div key={m.name} className="border border-border p-5 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-muted flex items-center justify-center">
                    <span className="text-xl font-bold text-muted-foreground">{m.name.charAt(4)}</span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{m.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{m.role}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      
      <PoshplexFooter />
    </div>
  );
};

export default OurStory;
