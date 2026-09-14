import { IServiceSchema, IPricingRuleSchema } from '../models/UserProfile.js';

export interface IPricingBreakdownItem {
  item: string;
  price: number;
  qty: number;
  deliveryDays: number;
  isUnpriced?: boolean;
}

export interface IPricingEngineResult {
  minPrice: number;
  maxPrice: number;
  deliveryDays: number;
  currency: string;
  breakdown: IPricingBreakdownItem[];
  unpricedQuestions: string[];
}

export function calculatePricing(
  detectedItems: Array<{ name: string; qty?: number }> = [],
  scopeComplexity: 'low' | 'medium' | 'high' = 'medium',
  services: IServiceSchema[] = [],
  pricingRules?: IPricingRuleSchema
): IPricingEngineResult {
  const currency = pricingRules?.currency || 'USD';
  const minProjectPrice = pricingRules?.minProjectPrice || 0;
  const hourlyRate = pricingRules?.hourlyRate;

  const breakdown: IPricingBreakdownItem[] = [];
  const unpricedQuestions: string[] = [];

  let subtotal = 0;
  let totalDeliveryDays = 0;

  for (const det of detectedItems) {
    const qty = Math.max(1, Math.round(det.qty || 1));
    const itemNameLower = (det.name || '').toLowerCase().trim();

    // Flexible service catalog match with word normalization
    const matchedService = services.find((s) => {
      const sNameLower = s.name.toLowerCase().replace(/application/g, 'app').replace(/development/g, 'dev').trim();
      const normItemName = itemNameLower.replace(/application/g, 'app').replace(/development/g, 'dev').trim();
      
      if (sNameLower === normItemName || sNameLower.includes(normItemName) || normItemName.includes(sNameLower)) {
        return true;
      }

      // Check word overlap
      const sTokens = sNameLower.split(/\s+/).filter(t => t.length > 2);
      const itemTokens = normItemName.split(/\s+/).filter(t => t.length > 2);
      const overlap = sTokens.filter(t => itemTokens.includes(t));
      return overlap.length >= Math.min(2, sTokens.length);
    });

    if (matchedService) {
      const itemPrice = (matchedService.basePrice || 0) * qty;
      const itemDays = (matchedService.deliveryDays || 3) * qty;
      subtotal += itemPrice;
      totalDeliveryDays += itemDays;

      breakdown.push({
        item: `${det.name}${qty > 1 ? ` (x${qty})` : ''}`,
        price: itemPrice,
        qty,
        deliveryDays: itemDays,
      });
    } else if (hourlyRate && hourlyRate > 0) {
      // Fallback policy using freelancer's explicitly configured hourly rate
      const estHoursPerUnit = scopeComplexity === 'high' ? 12 : scopeComplexity === 'medium' ? 6 : 3;
      const itemPrice = Math.round(estHoursPerUnit * hourlyRate * qty);
      const itemDays = Math.max(1, Math.ceil(estHoursPerUnit / 4)) * qty;
      subtotal += itemPrice;
      totalDeliveryDays += itemDays;

      breakdown.push({
        item: `${det.name}${qty > 1 ? ` (x${qty})` : ''}`,
        price: itemPrice,
        qty,
        deliveryDays: itemDays,
      });
    } else {
      // Unpriced item safety - DO NOT invent a price
      breakdown.push({
        item: `${det.name}${qty > 1 ? ` (x${qty})` : ''}`,
        price: 0,
        qty,
        deliveryDays: 1,
        isUnpriced: true,
      });

      unpricedQuestions.push(
        `Could not automatically calculate pricing for "${det.name}". Please specify custom requirements or select a standard service.`
      );
    }
  }

  // If no items were detected or breakdown is empty, build a default base entry if catalog exists
  if (breakdown.length === 0) {
    if (services.length > 0) {
      const baseService = services[0];
      const itemPrice = baseService.basePrice || 0;
      subtotal = itemPrice;
      totalDeliveryDays = baseService.deliveryDays || 3;
      breakdown.push({
        item: baseService.name,
        price: itemPrice,
        qty: 1,
        deliveryDays: totalDeliveryDays,
      });
    } else if (hourlyRate && hourlyRate > 0) {
      const estHours = scopeComplexity === 'high' ? 20 : scopeComplexity === 'medium' ? 10 : 5;
      subtotal = estHours * hourlyRate;
      totalDeliveryDays = Math.ceil(estHours / 4);
      breakdown.push({
        item: `Project Scope Estimate (${estHours} hrs @ $${hourlyRate}/hr)`,
        price: subtotal,
        qty: 1,
        deliveryDays: totalDeliveryDays,
      });
    }
  }

  // Enforce minimum project price
  const minPrice = Math.max(subtotal, minProjectPrice);

  // Apply scope complexity multipliers for max range
  let maxPrice = minPrice;
  if (scopeComplexity === 'high') {
    maxPrice = Math.round(minPrice * 1.4);
  } else if (scopeComplexity === 'medium') {
    maxPrice = Math.round(minPrice * 1.2);
  }

  // Calculate delivery days based on complexity
  const complexityMultiplier = scopeComplexity === 'high' ? 1.5 : scopeComplexity === 'medium' ? 1.2 : 1.0;
  const estimatedDeliveryDays = Math.max(
    3,
    Math.ceil(totalDeliveryDays * complexityMultiplier)
  );

  return {
    minPrice,
    maxPrice,
    deliveryDays: estimatedDeliveryDays,
    currency,
    breakdown,
    unpricedQuestions,
  };
}
