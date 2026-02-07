/**
 * Shipping configuration based on Thana/Location
 * 
 * This config maps thana names to shipping methods and costs.
 * No courier API dependency - purely frontend configuration.
 */

export interface ShippingConfig {
  method: 'inside_dhaka' | 'outside_dhaka';
  cost: number;
  estimatedDays: string;
  label: string;
}

// Default shipping options
export const SHIPPING_INSIDE_DHAKA: ShippingConfig = {
  method: 'inside_dhaka',
  cost: 60,
  estimatedDays: '1-2',
  label: 'Inside Dhaka',
};

export const SHIPPING_OUTSIDE_DHAKA: ShippingConfig = {
  method: 'outside_dhaka',
  cost: 120,
  estimatedDays: '3-5',
  label: 'Outside Dhaka',
};

// Division names that are considered "Inside Dhaka"
// Add division names here that should get inside Dhaka shipping
const DHAKA_DIVISIONS = [
  'dhaka',
  'ঢাকা',
];

// Specific thana names that override the division-based logic
// These thanas get "Inside Dhaka" shipping regardless of division
const INSIDE_DHAKA_THANAS: string[] = [
  // Add specific thana names here if needed
];

// These thanas get "Outside Dhaka" shipping even if in Dhaka division
const OUTSIDE_DHAKA_THANAS: string[] = [
  // Add specific thana names here if needed
];

/**
 * Determine shipping config based on division and thana names
 */
export const getShippingForLocation = (
  divisionName?: string,
  thanaName?: string
): ShippingConfig => {
  // If no location selected, default to outside Dhaka
  if (!divisionName && !thanaName) {
    return SHIPPING_OUTSIDE_DHAKA;
  }

  const normalizedDivision = divisionName?.toLowerCase().trim() || '';
  const normalizedThana = thanaName?.toLowerCase().trim() || '';

  // Check thana-specific overrides first
  if (INSIDE_DHAKA_THANAS.some(t => normalizedThana.includes(t.toLowerCase()))) {
    return SHIPPING_INSIDE_DHAKA;
  }

  if (OUTSIDE_DHAKA_THANAS.some(t => normalizedThana.includes(t.toLowerCase()))) {
    return SHIPPING_OUTSIDE_DHAKA;
  }

  // Check if division is Dhaka
  const isDhakaDivision = DHAKA_DIVISIONS.some(d => 
    normalizedDivision.includes(d.toLowerCase())
  );

  return isDhakaDivision ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
};

/**
 * Get shipping config by thana ID (for use with data hooks)
 * This function is used when you have the thana object with division info
 */
export const getShippingForThana = (
  thana?: { name: string; division?: { name: string } | null } | null,
  division?: { name: string } | null
): ShippingConfig => {
  const divisionName = thana?.division?.name || division?.name;
  const thanaName = thana?.name;
  
  return getShippingForLocation(divisionName, thanaName);
};
