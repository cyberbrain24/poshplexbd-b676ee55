import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SITE_NAME = "POSHPLEX";
const SITE_TAGLINE = "Premium Fashion & Lifestyle";
const FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} Poshplex. All rights reserved.`;
const FOOTER_EMAIL = "business@poshplexbd.com";

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

const PoshplexFooter = () => {
  const [email, setEmail] = useState("");

  return (
    <footer className="w-full bg-foreground text-background mt-20 relative overflow-hidden">
      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ═══ DESKTOP FOOTER ═══ */}
      <div className="hidden lg:block relative z-10">
        <div className="px-8 xl:px-12 py-16">
          <div className="flex gap-0">
            {/* LEFT BLOCK – Brand & Subscribe (~40%) */}
            <div className="w-[40%] pr-12 relative">
              {/* Logo with subtle entrance animation */}
              <motion.span
                initial={{ opacity: 0, x: -20, letterSpacing: "-0.05em" }}
                whileInView={{ opacity: 1, x: 0, letterSpacing: "-0.02em" }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-4xl font-black tracking-tighter block mb-4"
              >
                {SITE_NAME}
              </motion.span>

              <p className="text-background/50 text-sm tracking-wide mb-10">
                {SITE_TAGLINE}
              </p>

              {/* Subscribe */}
              <div className="mb-0">
                <p className="text-[10px] font-semibold tracking-[0.25em] mb-4 text-background/70">
                  JOIN THE MOVEMENT
                </p>
                <div className="flex max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 bg-transparent border border-background/25 rounded-l-lg px-4 py-2.5 text-sm placeholder:text-background/35 focus:outline-none focus:border-background/60 focus:shadow-[0_0_12px_rgba(255,255,255,0.06)] transition-all duration-200"
                  />
                  <button className="bg-background text-foreground px-5 py-2.5 text-xs font-semibold tracking-[0.15em] rounded-r-lg hover:bg-foreground hover:text-background border border-background hover:border-background transition-all duration-200">
                    SUBSCRIBE
                  </button>
                </div>
              </div>

              {/* Thin vertical accent line */}
              <div className="absolute right-0 top-0 bottom-0 w-px bg-background/10" />
            </div>

            {/* RIGHT BLOCK – Link Columns (~60%) */}
            <div className="w-[60%] pl-12 grid grid-cols-4 gap-6 pt-1">
              {FOOTER_COLUMNS.map((column, index) => (
                <div
                  key={column.title}
                  style={{ marginTop: index % 2 === 1 ? "12px" : "0" }}
                >
                  <h4 className="text-[11px] font-semibold tracking-[0.2em] mb-5 text-background/90">
                    {column.title.toUpperCase()}
                  </h4>
                  <ul className="space-y-3">
                    {column.links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className="group relative text-sm text-background/50 hover:text-background transition-colors duration-200 inline-block"
                        >
                          {link.label}
                          <span className="absolute bottom-0 left-0 w-full h-px bg-background/60 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 px-8 xl:px-12 py-5">
          <div className="flex items-center justify-between text-xs text-background/40">
            <a
              href={`mailto:${FOOTER_EMAIL}`}
              className="hover:text-background transition-colors duration-200"
            >
              {FOOTER_EMAIL}
            </a>
            <p>{FOOTER_COPYRIGHT}</p>
            <a
              href="https://cyberbrain.com.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-background transition-colors duration-200"
            >
              Design & Developed by CyberBrain.com.bd
            </a>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE FOOTER ═══ */}
      <div className="lg:hidden relative z-10">
        {/* Brand + Subscribe */}
        <div className="px-6 pt-14 pb-8">
          <motion.span
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="text-3xl font-black tracking-tighter block mb-3"
          >
            {SITE_NAME}
          </motion.span>
          <p className="text-background/50 text-sm tracking-wide mb-8">
            {SITE_TAGLINE}
          </p>

          <p className="text-[10px] font-semibold tracking-[0.25em] mb-3 text-background/70">
            JOIN THE MOVEMENT
          </p>
          <div className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="flex-1 bg-transparent border border-background/25 rounded-l-lg px-4 py-3 text-sm placeholder:text-background/35 focus:outline-none focus:border-background/60 transition-all duration-200"
            />
            <button className="bg-background text-foreground px-5 py-3 text-xs font-semibold tracking-[0.15em] rounded-r-lg hover:bg-foreground hover:text-background border border-background hover:border-background transition-all duration-200">
              SUBSCRIBE
            </button>
          </div>
        </div>

        {/* Accordion Link Sections */}
        <div className="px-6">
          <Accordion type="single" collapsible className="w-full">
            {FOOTER_COLUMNS.map((column) => (
              <AccordionItem
                key={column.title}
                value={column.title}
                className="border-background/10"
              >
                <AccordionTrigger className="py-4 text-[11px] font-semibold tracking-[0.2em] text-background/90 hover:no-underline hover:tracking-[0.25em] transition-all duration-200 [&[data-state=open]]:text-background">
                  {column.title.toUpperCase()}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-3 pl-1">
                    {column.links.map((link) => (
                      <li key={link.path}>
                        <Link
                          to={link.path}
                          className="text-sm text-background/50 hover:text-background transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Mobile Bottom */}
        <div className="border-t border-background/10 px-6 py-6 mt-4 space-y-3 text-center">
          <a
            href={`mailto:${FOOTER_EMAIL}`}
            className="block text-xs text-background/50 hover:text-background transition-colors duration-200"
          >
            {FOOTER_EMAIL}
          </a>
          <p className="text-[11px] text-background/35">{FOOTER_COPYRIGHT}</p>
          <a
            href="https://cyberbrain.com.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-background/35 hover:text-background transition-colors duration-200"
          >
            Design & Developed by CyberBrain.com.bd
          </a>
        </div>
      </div>
    </footer>
  );
};

export default PoshplexFooter;
