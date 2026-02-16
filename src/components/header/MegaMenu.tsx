import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface MegaMenuProps {
  activeItem: {
    name: string;
    href: string;
    submenu: {
      categories: string[];
      featured: { name: string; href: string }[];
    };
  };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MegaMenu = ({ activeItem, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  return (
    <div 
      className="absolute top-full left-0 right-0 bg-background border-b border-border z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-6 py-8">
        <div className="flex gap-16">
          {/* Categories */}
          <div className="flex-1">
            <p className="text-xs font-medium tracking-wider text-muted-foreground mb-4">
              CATEGORIES
            </p>
            <ul className="space-y-3">
              {activeItem.submenu.categories.map((category) => (
                <li key={category}>
                  <Link 
                    to={`/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-foreground hover:text-nav-hover transition-colors text-sm font-medium tracking-wide block"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured */}
          {activeItem.submenu.featured.length > 0 && (
            <div className="flex-1">
              <p className="text-xs font-medium tracking-wider text-muted-foreground mb-4">
                FEATURED
              </p>
              <ul className="space-y-3">
                {activeItem.submenu.featured.map((item) => (
                  <li key={item.name}>
                    <Link 
                      to={item.href}
                      className="text-foreground hover:text-nav-hover transition-colors text-sm font-medium tracking-wide flex items-center gap-2"
                    >
                      {item.name}
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* View All CTA */}
          <div className="flex-1 flex items-end">
            <Link 
              to={activeItem.href}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium tracking-wider hover:bg-primary-hover transition-colors"
            >
              VIEW ALL {activeItem.name}
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;