import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { isExternalLink } from "@/hooks/useSiteSettings";

const PoshplexFooter = () => {
  const { settings } = useSiteSettingsContext();

  const renderLink = (path: string, label: string, className: string) => {
    if (isExternalLink(path)) {
      return (
        <a href={path} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    return (
      <Link to={path} className={className}>
        {label}
      </Link>
    );
  };

  const socialLinks = settings.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some(url => url && url.length > 0);

  return (
    <footer className="w-full bg-foreground text-background mt-20">
      {/* Main Footer Content */}
      <div className="px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-5">
            {settings.logo_dark_url ? (
              <img 
                src={settings.logo_dark_url} 
                alt={settings.site_name}
                className="h-8 mb-6 object-contain"
              />
            ) : (
              <span className="text-3xl font-black tracking-tighter block mb-6">
                {settings.site_name.toUpperCase()}
              </span>
            )}
            {settings.tagline && (
              <p className="text-background/70 text-sm mb-6 max-w-sm">
                {settings.tagline}
              </p>
            )}
            
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
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Instagram size={18} strokeWidth={1.5} />
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Facebook size={18} strokeWidth={1.5} />
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Twitter size={18} strokeWidth={1.5} />
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 border border-background/30 hover:bg-background hover:text-foreground transition-colors">
                    <Youtube size={18} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Footer Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {settings.footer_columns.map((column, index) => (
              <div key={index}>
                <h4 className="text-xs font-medium tracking-wider mb-4">
                  {column.title.toUpperCase()}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      {renderLink(
                        link.path,
                        link.label,
                        "text-sm text-background/70 hover:text-background transition-colors"
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {(settings.footer_contact_email || settings.footer_contact_phone || settings.footer_address) && (
        <div className="border-t border-background/20 px-6 py-6">
          <div className="flex flex-col md:flex-row gap-6 text-sm text-background/70">
            {settings.footer_contact_email && (
              <a href={`mailto:${settings.footer_contact_email}`} className="hover:text-background transition-colors">
                {settings.footer_contact_email}
              </a>
            )}
            {settings.footer_contact_phone && (
              <a href={`tel:${settings.footer_contact_phone}`} className="hover:text-background transition-colors">
                {settings.footer_contact_phone}
              </a>
            )}
            {settings.footer_address && (
              <span>{settings.footer_address}</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-background/20 px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/50">
            {settings.footer_copyright || `© ${new Date().getFullYear()} ${settings.site_name}. All rights reserved.`}
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
