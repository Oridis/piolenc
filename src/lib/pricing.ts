/**
 * Server-Side Calculation Engine for Pricing, Taxes, and Freight
 * Enforces strict verification: never trusts client pricing.
 */

export interface TaxRule {
  countryCode: string;
  woodVatRate: number; // e.g. 5.5% in FR, 7% in DE, 6% in BE, 8.1% in CH
  standardVatRate: number; // For accessories/delivery: 20% FR, 19% DE, 21% BE, 8.1% CH
  currency: string;
  exchangeRateFromEUR: number; // 1.0 for EUR, ~0.95 for CHF
}

export const COUNTRY_TAX_RULES: Record<string, TaxRule> = {
  FR: {
    countryCode: 'FR',
    woodVatRate: 5.5, // Taux réduit bois énergie en France (Art. 278-0 bis du CGI)
    standardVatRate: 20.0,
    currency: 'EUR',
    exchangeRateFromEUR: 1.0,
  },
  DE: {
    countryCode: 'DE',
    woodVatRate: 7.0, // Ermäßigter Steuersatz Brennholz in Deutschland (§ 12 Abs. 2 UStG)
    standardVatRate: 19.0,
    currency: 'EUR',
    exchangeRateFromEUR: 1.0,
  },
  BE: {
    countryCode: 'BE',
    woodVatRate: 6.0, // Taux réduit bois de chauffage Belgique
    standardVatRate: 21.0,
    currency: 'EUR',
    exchangeRateFromEUR: 1.0,
  },
  CH: {
    countryCode: 'CH',
    woodVatRate: 8.1, // TVA Suisse taux normal / combustible
    standardVatRate: 8.1,
    currency: 'CHF',
    exchangeRateFromEUR: 0.95,
  },
};

export interface CartCalculationItem {
  productId: string;
  quantity: number;
}

export interface DeliveryCalculationInput {
  countryCode: string;
  postalCode: string;
  itemsCount: number;
  totalWeightKg: number;
  difficultAccess?: boolean;
}

export function calculateShippingFee(input: DeliveryCalculationInput, subtotalTTC: number, freeShippingThreshold = 650): {
  shippingFeeHT: number;
  shippingFeeTTC: number;
  vatRate: number;
  estimatedLeadDays: number;
  carrierName: string;
  isEligibleForFreeShipping: boolean;
} {
  const country = input.countryCode.toUpperCase();
  const taxRule = COUNTRY_TAX_RULES[country] || COUNTRY_TAX_RULES.FR;

  // Base shipping tariff per country
  let baseRateEUR = 49.0;
  let perPalletRateEUR = 18.0;
  let estimatedDays = 4;
  let carrierName = 'Geodis Calberson';

  if (country === 'DE') {
    baseRateEUR = 59.0;
    perPalletRateEUR = 22.0;
    estimatedDays = 5;
    carrierName = 'Dachser European Logistics';
  } else if (country === 'BE') {
    baseRateEUR = 52.0;
    perPalletRateEUR = 19.0;
    estimatedDays = 4;
    carrierName = 'Geodis Eurofirst';
  } else if (country === 'CH') {
    baseRateEUR = 89.0; // Douane + transport spécifique Suisse
    perPalletRateEUR = 28.0;
    estimatedDays = 6;
    carrierName = 'Schenker Suisse Transports';
  }

  // Difficult access supplement (narrow street, mountain zone, steep slope)
  const difficultAccessSupplementEUR = input.difficultAccess ? 35.0 : 0.0;

  // Free shipping condition (applicable within France and Belgium above threshold)
  const isFreeEligible = (country === 'FR' || country === 'BE') && subtotalTTC >= freeShippingThreshold;

  let feeEUR = 0;
  if (!isFreeEligible) {
    const additionalUnits = Math.max(0, input.itemsCount - 1);
    feeEUR = baseRateEUR + additionalUnits * perPalletRateEUR + difficultAccessSupplementEUR;
  } else if (difficultAccessSupplementEUR > 0) {
    // Difficult access remains billable even when base freight is offered
    feeEUR = difficultAccessSupplementEUR;
  }

  // Convert to local currency (e.g. CHF for Switzerland)
  const feeLocalCurrency = Number((feeEUR * taxRule.exchangeRateFromEUR).toFixed(2));
  const vatRate = taxRule.standardVatRate;
  const shippingFeeHT = Number((feeLocalCurrency / (1 + vatRate / 100)).toFixed(2));
  const shippingFeeTTC = feeLocalCurrency;

  return {
    shippingFeeHT,
    shippingFeeTTC,
    vatRate,
    estimatedLeadDays: estimatedDays,
    carrierName,
    isEligibleForFreeShipping: isFreeEligible,
  };
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  if (currency === 'CHF') {
    return `${amount.toFixed(2).replace('.', ',')} CHF`;
  }
  return `${amount.toFixed(2).replace('.', ',')} €`;
}
