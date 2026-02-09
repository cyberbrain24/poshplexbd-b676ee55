/**
 * Library utilities barrel file
 * Central export point for utility functions
 */

// Core utilities
export { cn } from './utils';

// Currency formatting
export {
  CURRENCY_SYMBOL,
  CURRENCY_CODE,
  CURRENCY_LOCALE,
  formatCurrency,
  formatCurrencyWithSign,
  parseCurrency,
} from './currency';

// Text and date formatting
export {
  formatPhoneNumber,
  isValidBDPhone,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  truncateText,
  capitalizeWords,
  getInitials,
} from './formatters';

// Query helpers
export {
  QUERY_KEYS,
  invalidateOrderQueries,
  invalidateProductQueries,
  invalidateCustomerQueries,
  invalidateAccountQueries,
  invalidatePaymentQueries,
  handleMutationError,
} from './query-helpers';

// Slug utilities
export {
  generateProductSlug,
  extractIdFromSlug,
} from './slug';
