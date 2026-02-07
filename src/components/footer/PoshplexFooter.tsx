import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";

// Hardcoded site settings
const SITE_NAME = "POSHPLEX";
const SITE_TAGLINE = "Premium Fashion & Lifestyle";
const FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} Poshplex. All rights reserved.`;
const FOOTER_EMAIL = "hello@poshplex.com";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", path: "/category/all" },
      { label: "New Arrivals", path: "/category/new-arrivals" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", path: "/about/our-story" },
      { label: "Sustainability", path: "/about/sustainability" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Size Guide", path: "/about/size-guide" },
      { label: "Customer Care", path: "/about/customer-care" },
      { label: "Store Locator", path: "/about/store-locator" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", path: "/privacy-policy" },
      { label: "Terms of Service", path: "/terms-of-service" },
    ],
  },
];

const SOCIAL_LINKS = {
  instagram: "",
  facebook: "",
  twitter: "",
  youtube: "",
};

const PoshplexFooter = () => {
  const hasSocialLinks = Object.values(SOCIAL_LINKS).some(url => url && url.length > 0);

  return (
    <footer className="w-full bg-foreground text-background mt-20">
      {/* Main Footer Content */}
      <div className="px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5">
            <span className="text-3xl font-black tracking-tighter block mb-6">
              {SITE_NAME}
            </span>
            <p className="text-background/70 text-sm mb-6 max-w-sm">
              {SITE_TAGLINE}
            </p>
            
            {/* Newsletter */}
            <div className="mb-8">
              <p className="text-xs font-medium tracking-wider mb-3">
                JOIN THE MOVEMENT
              </p>
              <div className="flex">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-transparent border border-background/30 px-4 py-3 text-sm placeholder:text-background/50 focus:outline-none focus:border-background"
                />
                <button className="bg-background text-foreground px-6 py-3 text-sm font-medium tracking-wider hover:bg-background/90 transition-colors">
                  SUBSCRIBE
                </button>
              </div>
            </div>

            {/* Social Icons */}
            {hasSocialLinks && (
              <div className="flex gap-4">
                {SOCIAL_LINKS.instagram && (
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Instagram size={18} strokeWidth={1.5} />
                  </a>
                )}
                {SOCIAL_LINKS.facebook && (
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Facebook size={18} strokeWidth={1.5} />
                  </a>
                )}
                {SOCIAL_LINKS.twitter && (
                  <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Twitter size={18} strokeWidth={1.5} />
                  </a>
                )}
                {SOCIAL_LINKS.youtube && (
                  <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Youtube size={18} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {FOOTER_COLUMNS.map((column, index) => (
              <div key={index}>
                <h4 className="text-xs font-medium tracking-wider mb-4">
                  {column.title.toUpperCase()}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        to={link.path}
                        className="text-sm text-background/70 hover:text-background transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {FOOTER_EMAIL && (
        <div className="border-t border-background/20 px-6 py-6">
          <div className="flex flex-col md:flex-row gap-6 text-sm text-background/70">
            <a href={`mailto:${FOOTER_EMAIL}`} className="hover:text-background transition-colors">
              {FOOTER_EMAIL}
            </a>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-background/20 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            {FOOTER_COPYRIGHT}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-xs text-background/50 hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-xs text-background/50 hover:text-background transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PoshplexFooter;