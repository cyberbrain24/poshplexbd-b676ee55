import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCategories, useColors, useSizes } from "@/hooks/useMasterData";

export type SortOption = "newest" | "price_asc" | "price_desc" | "name_asc";

export interface ProductFilters {
  colorIds: string[];
  sizeIds: string[];
  subcategoryIds: string[];
  priceRange: string | null;
}

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount?: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  parentCategoryId?: string | null;
}

const PRICE_RANGES = [
  { label: "Under ৳500", key: "0-500" },
  { label: "৳500 - ৳1,000", key: "500-1000" },
  { label: "৳1,000 - ৳2,000", key: "1000-2000" },
  { label: "Over ৳2,000", key: "2000-" },
];

const FilterSortBar = ({
  filtersOpen,
  setFiltersOpen,
  itemCount,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  parentCategoryId,
}: FilterSortBarProps) => {
  const { data: allCategories = [] } = useCategories();
  const { data: colors = [] } = useColors();
  const { data: sizes = [] } = useSizes();

  // Get subcategories for the current parent category
  const subcategories = parentCategoryId
    ? allCategories.filter((c) => c.parent_id === parentCategoryId && c.is_active !== false)
    : [];

  const activeFilterCount =
    filters.colorIds.length +
    filters.sizeIds.length +
    filters.subcategoryIds.length +
    (filters.priceRange ? 1 : 0);

  const toggleFilter = (
    key: "colorIds" | "sizeIds" | "subcategoryIds",
    id: string
  ) => {
    const current = filters[key];
    const next = current.includes(id)
      ? current.filter((v) => v !== id)
      : [...current, id];
    onFiltersChange({ ...filters, [key]: next });
  };

  const togglePrice = (key: string) => {
    onFiltersChange({
      ...filters,
      priceRange: filters.priceRange === key ? null : key,
    });
  };

  const clearAll = () => {
    onFiltersChange({
      colorIds: [],
      sizeIds: [],
      subcategoryIds: [],
      priceRange: null,
    });
  };

  return (
    <section className="w-full px-6 mb-8 border-b border-border pb-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-light text-muted-foreground">
          {itemCount} items
        </p>

        <div className="flex items-center gap-4">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="font-light hover:bg-transparent"
              >
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 bg-background border-none shadow-none overflow-y-auto"
            >
              <SheetHeader className="mb-6 border-b border-border pb-4">
                <SheetTitle className="text-lg font-light">Filters</SheetTitle>
              </SheetHeader>

              <div className="space-y-8">
                {/* Subcategory Filter */}
                {subcategories.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-light mb-4 text-foreground">
                        Subcategory
                      </h3>
                      <div className="space-y-3">
                        {subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              id={`sub-${sub.id}`}
                              checked={filters.subcategoryIds.includes(sub.id)}
                              onCheckedChange={() =>
                                toggleFilter("subcategoryIds", sub.id)
                              }
                              className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                            />
                            <Label
                              htmlFor={`sub-${sub.id}`}
                              className="text-sm font-light text-foreground cursor-pointer"
                            >
                              {sub.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator className="border-border" />
                  </>
                )}

                {/* Color Filter */}
                {colors.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-light mb-4 text-foreground">
                        Color
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => toggleFilter("colorIds", color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${
                              filters.colorIds.includes(color.id)
                                ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                                : "border-border hover:border-foreground/50"
                            }`}
                            style={{ backgroundColor: color.hex_code }}
                          />
                        ))}
                      </div>
                    </div>
                    <Separator className="border-border" />
                  </>
                )}

                {/* Size Filter */}
                {sizes.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-light mb-4 text-foreground">
                        Size
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => toggleFilter("sizeIds", size.id)}
                            className={`min-w-10 h-8 px-3 border text-sm font-light transition-all ${
                              filters.sizeIds.includes(size.id)
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-foreground text-foreground"
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator className="border-border" />
                  </>
                )}

                {/* Price Filter */}
                <div>
                  <h3 className="text-sm font-light mb-4 text-foreground">
                    Price
                  </h3>
                  <div className="space-y-3">
                    {PRICE_RANGES.map((range) => (
                      <div
                        key={range.key}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`price-${range.key}`}
                          checked={filters.priceRange === range.key}
                          onCheckedChange={() => togglePrice(range.key)}
                          className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                        />
                        <Label
                          htmlFor={`price-${range.key}`}
                          className="text-sm font-light text-foreground cursor-pointer"
                        >
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="border-border" />

                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltersOpen(false)}
                    className="w-full border-none hover:bg-transparent hover:underline font-normal text-left justify-start"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="w-full border-none hover:bg-transparent hover:underline font-light text-left justify-start"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={sortBy}
            onValueChange={(v) => onSortChange(v as SortOption)}
          >
            <SelectTrigger className="w-auto border-none bg-transparent text-sm font-light shadow-none rounded-none pr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="shadow-none border-none rounded-none bg-background">
              <SelectItem
                value="newest"
                className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden"
              >
                Newest
              </SelectItem>
              <SelectItem
                value="price_asc"
                className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden"
              >
                Price: Low to High
              </SelectItem>
              <SelectItem
                value="price_desc"
                className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden"
              >
                Price: High to Low
              </SelectItem>
              <SelectItem
                value="name_asc"
                className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden"
              >
                Name A-Z
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default FilterSortBar;
