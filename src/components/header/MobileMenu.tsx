import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SubcategoryItem {
  name: string;
  href: string;
  image_url: string | null;
}

interface MobileMenuProps {
  navItems: {
    name: string;
    href: string;
    submenu: {
      subcategories: SubcategoryItem[];
      featured: { name: string; href: string }[];
    };
  }[];
  onClose: () => void;
}

const MobileMenu = ({ navItems, onClose }: MobileMenuProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border z-50 max-h-[80vh] overflow-y-auto">
      <div className="px-6 py-6">
        <div className="space-y-4">
          {navItems.map((item) => (
            <div key={item.name} className="border-b border-border pb-4">
              <button
                className="flex items-center justify-between w-full text-foreground text-sm font-medium tracking-wider"
                onClick={() => setExpandedItem(expandedItem === item.name ? null : item.name)}
              >
                {item.name}
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${expandedItem === item.name ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </button>
              
              {expandedItem === item.name && (
                <div className="mt-4 pl-4 space-y-3">
                  {item.submenu.subcategories.map((sub) => (
                    <Link
                      key={sub.name}
                      to={sub.href}
                      className="block text-muted-foreground hover:text-foreground text-sm tracking-wide"
                      onClick={onClose}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
