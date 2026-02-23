import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SubcategoryItem {
  name: string;
  href: string;
  image_url: string | null;
}

interface MegaMenuProps {
  activeItem: {
    name: string;
    href: string;
    submenu: {
      subcategories: SubcategoryItem[];
      featured: { name: string; href: string }[];
    };
  };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MegaMenu = ({ activeItem, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  const subcategories = activeItem.submenu.subcategories;

  return (
    <div 
      className="absolute top-full left-0 right-0 bg-background border-b border-border z-50"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {subcategories.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 justify-items-center w-full">
              {subcategories.map((sub) => (
                <Link
                  key={sub.name}
                  to={sub.href}
                  className="group flex flex-col items-center gap-2 w-full"
                >
                  <div className="w-full aspect-square rounded-[10px] overflow-hidden bg-muted">
                    {sub.image_url ? (
                      <img
                        src={sub.image_url}
                        alt={sub.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-medium tracking-wider text-foreground group-hover:text-primary transition-colors text-center leading-tight">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* View All CTA */}
            <Link 
              to={activeItem.href}
              className="mt-6 inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 text-xs font-medium tracking-wider uppercase hover:bg-primary-hover transition-colors"
            >
              View All {activeItem.name}
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link 
              to={activeItem.href}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium tracking-wider hover:bg-primary-hover transition-colors"
            >
              VIEW ALL {activeItem.name}
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MegaMenu;
