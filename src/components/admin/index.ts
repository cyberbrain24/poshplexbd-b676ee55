/**
 * Admin components barrel file
 * Central export point for admin UI components
 */

// Loading and error handling utilities
export { 
  AdminLoadingSpinner, 
  AdminTableSkeleton, 
  AdminDashboardSkeleton,
  AdminCardSkeleton,
  InlineLoader 
} from "./AdminLoadingState";

export { 
  AdminErrorBoundary, 
  QueryErrorDisplay 
} from "./AdminErrorBoundary";

// Layout components (default exports)
export { default as AdminLayout } from "./AdminLayout";
export { default as AdminSidebar } from "./AdminSidebar";

// Table utilities
export { VirtualizedTable } from "./VirtualizedTable";
export { default as PaginationControls } from "./PaginationControls";

// Form components
export { default as DebouncedSearchInput } from "./DebouncedSearchInput";
export { DebouncedLink } from "./DebouncedLink";
export { ImageGrid } from "./ImageGrid";
export { VariantTable } from "./VariantTable";

// Modal components (default exports)
export { default as CustomerModal } from "./CustomerModal";
export { default as CustomerTypeModal } from "./CustomerTypeModal";
export { default as DivisionModal } from "./DivisionModal";
export { default as MasterDataModal } from "./MasterDataModal";
export { default as OrderDetailModal } from "./OrderDetailModal";
export { default as OrderItemEditModal } from "./OrderItemEditModal";
export { PaymentMethodModal } from "./PaymentMethodModal";
export { default as ProductModal } from "./ProductModal";
export { default as PromoUsageHistoryModal } from "./PromoUsageHistoryModal";

export { default as ThanaModal } from "./ThanaModal";
