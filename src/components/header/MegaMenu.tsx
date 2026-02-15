import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SubcategoryItem {
  id: string;
  name: string;
  image_url?: string | null;
}

interface MegaMenuProps {
  activeItem: {
    name: string;
    href: string;
    subcategories: SubcategoryItem[];
  };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const MegaMenu = ({ activeItem, onMouseEnter, onMouseLeave }: MegaMenuProps) => {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  // Fetch a representative product image for each subcategory
  useEffect(() => {
    const fetchImages = async () => {
      const ids = activeItem.subcategories.map(s => s.id);
      if (ids.length === 0) return;

      const { data } = await supabase
        .from('products')
        .select('category_id, product_images!inner(image_url, is_main)')
        .in('category_id', ids)
        .eq('product_images.is_main', true)
        .limit(50);

      if (data) {
        const imageMap: Record<string, string> = {};
        for (const product of data) {
          const catId = product.category_id;
          if (catId && !imageMap[catId] && (product as any).product_images?.[0]?.image_url) {
            imageMap[catId] = (product as any).product_images[0].image_url;
          }
        }
        setCategoryImages(imageMap);
      }
    };

    fetchImages();
  }, [activeItem.subcategories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full left-0 right-0 bg-background z-50 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Section Title */}
        <div className="mb-8">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {activeItem.name}
          </h3>
          <div className="mt-2 w-8 h-px bg-foreground" />
        </div>

        {/* Subcategory Grid – 6 per row, centered if fewer */}
        {activeItem.subcategories.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-8">
            {activeItem.subcategories.map((sub) => {
              const imgUrl = sub.image_url || categoryImages[sub.id];
              const slug = sub.name.toLowerCase().replace(/\s+/g, '-');

              return (
                <Link
                  key={sub.id}
                  to={`/category/${slug}`}
                  className="group w-[calc((100%-5*1.5rem)/6)] min-w-[130px]"
                >
                  {/* Image Card */}
                  <div className="relative aspect-[4/5] rounded-[13px] overflow-hidden bg-muted shadow-sm">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={sub.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-foreground/90 flex items-center justify-center">
                        <span className="text-background/40 text-xs font-bold tracking-widest uppercase">
                          {sub.name.slice(0, 2)}
                        </span>
                      </div>
                    )}
                    {/* Subtle dark overlay on hover */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-200 rounded-[13px]" />
                  </div>

                  {/* Title */}
                  <div className="mt-3 text-center">
                    <span className={cn(
                      "text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground",
                      "relative inline-block",
                      "after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-px after:bottom-0 after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-200 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left"
                    )}>
                      {sub.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No subcategories available</p>
        )}

        {/* CTA Button */}
        <div className="mt-10 flex justify-center">
          <Link
            to={activeItem.href}
            className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase rounded-[9px] hover:bg-foreground/85 hover:-translate-y-px transition-all duration-200"
          >
            VIEW ALL {activeItem.name}
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;
