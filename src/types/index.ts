/**
 * Central type exports
 * Import types from this barrel file for consistency
 */

// Order types
export type {
  OrderStatus,
  PaymentStatus,
  PaymentMethodType,
  ItemFulfillmentStatus,
  RiskLevel,
  Order,
  OrderCustomer,
  OrderPaymentMethod,
  OrderItem,
  OrderStatusHistory,
  PaymentMethod,
  PaymentMethodFormData,
  OrderFilters,
} from './orders';

// Customer types
export type {
  Division,
  Thana,
  CustomerType,
  CustomerAccount,
  Customer,
  CustomerFilters,
  CustomerFormData,
} from './customers';




// Product types (re-export from existing)
export type {
  Product,
  ProductFormData,
  ProductImage,
  ProductVariant,
  VariantFormData,
  Color,
  Size,
  Material,
  Category,
  Brand,
  SizeGuide,
  CareInstruction,
} from './product';
