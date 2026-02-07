/**
 * Hooks barrel file
 * Central export point for all custom hooks
 * 
 * Usage:
 * import { useOrders, useProducts, useCustomers } from '@/hooks';
 */

// Order hooks
export {
  useOrders,
  useOrder,
  useOrderHistory,
  usePaymentMethods,
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
  useUpdateItemFulfillment,
  useUpdateOrder,
  useDeleteOrder,
} from './useOrders';

export {
  useOptimizedOrders,
  useOptimizedOrderStats,
} from './useOptimizedOrders';

export {
  useOrderPayments,
  useRecordPayment,
} from './useOrderPayments';

// Product hooks
export {
  useProducts,
  useProductsList,
  useProduct,
  useProductCount,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAddProductImage,
  useDeleteProductImage,
  useAddProductVariant,
  useUpdateProductVariant,
  useDeleteProductVariant,
  uploadProductImage,
} from './useProducts';

export {
  useOptimizedProducts,
  useOptimizedCategoryProducts,
  useProductStats,
} from './useOptimizedProducts';

// Customer hooks
export {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useDivisions,
  useCreateDivision,
  useUpdateDivision,
  useDeleteDivision,
  useThanas,
  useCreateThana,
  useUpdateThana,
  useDeleteThana,
  useCustomerTypes,
  useCreateCustomerType,
  useUpdateCustomerType,
  useDeleteCustomerType,
  usePromoUsages,
  useCreatePromoUsage,
  useDeletePromoUsage,
} from './useCustomers';

// Account & Transaction hooks
export {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useTransactionCategories,
  useCreateTransactionCategory,
  useUpdateTransactionCategory,
  useDeleteTransactionCategory,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './useAccounts';

// Payment method hooks
export {
  usePaymentMethodsAdmin,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useTogglePaymentMethodStatus,
} from './usePaymentMethods';

// Master data hooks
export {
  useColors,
  useCreateColor,
  useUpdateColor,
  useDeleteColor,
  useSizes,
  useCreateSize,
  useUpdateSize,
  useDeleteSize,
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useSizeGuides,
  useCreateSizeGuide,
  useUpdateSizeGuide,
  useDeleteSizeGuide,
  useCareInstructions,
  useCreateCareInstruction,
  useUpdateCareInstruction,
  useDeleteCareInstruction,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from './useMasterData';

// Location hooks (public storefront)
export {
  useDivisions as useDivisionsPublic,
  useThanas as useThanasPublic,
} from './useLocationData';

// Shipping hooks
export {
  useCreateShipment,
  useBulkCreateShipments,
  useTrackShipment,
  useTrackByInvoice,
  useSteadfastBalance,
  useCreateReturn,
  useReturnRequests,
  useSteadfastPayments,
  usePoliceStations,
  useSyncLocationsFromSteadfast,
  useResetShipping,
  STEADFAST_STATUS_MAP,
} from './useSteadfast';

// Utility hooks
export { useDebounce, useDebouncedCallback, usePagination } from '@/utils/performance';
export { useDebouncedNavigation } from './useDebouncedNavigation';
export { useIsMobile } from './use-mobile';
export { useToast } from './use-toast';
export { useAdminQuery } from './useAdminQuery';
