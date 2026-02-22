import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useSiteBranding } from "@/hooks/useSiteBranding";

const FOOTER_COLUMNS = [
  {
    title: "SHOP",
    links: [
      { label: "All Products", path: "/category/all" },
      { label: "New Arrivals", path: "/category/new-arrivals" },
    ],
  },
  {
    title: "ABOUT",
    links: [
      { label: "Our Story", path: "/pages/our-story" },
      { label: "Find Us", path: "/pages/store-locator" },
    ],
  },
  {
    title: "LEGAL",
    links: [
      { label: "Privacy Policy", path: "/pages/privacy-policy" },
      { label: "Terms & Conditions", path: "/pages/terms-conditions" },
      { label: "Shipping & Delivery", path: "/pages/shipping-delivery" },
    ],
  },
];

const PoshplexFooter = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { data: branding } = useSiteBranding();

  const toggleSection = (title: string) => {
    setOpenSection(openSection === title ? null : title);
  };

  return (
    <footer className="w-full mt-20" style={{ background: "linear-gradient(180deg, #3a3a3a 0%, #2f2f2f 100%)" }}>
      {/* Main Content */}
      <div className="px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Brand & Newsletter */}
          <div className="lg:col-span-4">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt={branding?.site_name || "POSHPLEX"} className="h-10 object-contain mb-2" />
            ) : (
              <span className="text-[28px] font-black tracking-tight text-white block mb-2">
                {branding?.site_name || "POSHPLEX"}
              </span>
            )}
            <p className="text-white/60 text-sm mb-8">
              {branding?.slogan || "BE POSH WITH POSHPLEX"}
            </p>

            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/80 mb-3">
              JOIN THE MOVEMENT
            </p>
            <div className="flex max-w-xs">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 bg-transparent border border-white/25 rounded-none px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
              />
              <button className="bg-white text-[#2f2f2f] px-5 py-2.5 text-xs font-semibold tracking-wider whitespace-nowrap">
                SUBSCRIBE
              </button>
            </div>
          </div>

          {/* Desktop Link Columns */}
          <div className="hidden lg:grid lg:col-span-8 grid-cols-3 gap-6">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold tracking-[0.15em] text-white mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-sm text-white/60">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion Columns */}
          <div className="lg:hidden space-y-0 border-t border-white/10">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="border-b border-white/10">
                <button
                  onClick={() => toggleSection(col.title)}
                  className="w-full flex items-center justify-between py-3.5 text-xs font-semibold tracking-[0.15em] text-white"
                >
                  {col.title}
                  <ChevronDown
                    size={16}
                    className={`text-white/50 ${openSection === col.title ? "rotate-180" : ""}`}
                  />
                </button>
                {openSection === col.title && (
                  <ul className="pb-3 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.path}>
                        <Link to={link.path} className="text-sm text-white/60">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
          <a href="mailto:business@poshplexbd.com" className="text-white/40">
            business@poshplexbd.com
          </a>
          <span>© 2026 Poshplex. All rights reserved.</span>
          <span>
            Design &amp; Developed by{" "}
            <a href="https://cyberbrain.com.bd" target="_blank" rel="noopener noreferrer" className="text-white/50">
              CyberBrain.com.bd
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default PoshplexFooter;
