/**
 * Currency formatting utilities for BDT (Bangladeshi Taka)
 */

export const CURRENCY_SYMBOL = "৳";
export const CURRENCY_CODE = "BDT";
export const CURRENCY_LOCALE = "en-BD";

/**
 * Format a number as BDT currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ৳ symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined, showSymbol = true): string => {
  if (amount === null || amount === undefined) return showSymbol ? "৳0" : "0";
  
  const formatted = amount.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `৳${formatted}` : formatted;
};

/**
 * Format currency with explicit positive/negative sign
 * @param amount - The amount to format
 * @returns Formatted currency string with sign
 */
export const formatCurrencyWithSign = (amount: number): string => {
  const formatted = formatCurrency(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
};

/**
 * Parse a currency string back to number
 * @param value - Currency string to parse
 * @returns Parsed number
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[৳,\s]/g, "");
  return parseFloat(cleaned) || 0;
};
