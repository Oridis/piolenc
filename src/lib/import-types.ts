export interface ImportedProduct {
  reference?: string;
  slug?: string;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  species: string;
  woodType: string;
  humidityRate: string;
  calorificValue: string;
  logLength: string;
  unit: string;
  priceHT: number;
  priceTTC: number;
  vatRate: number;
  promoPrice?: number | null;
  promoStartDate?: Date | null;
  promoEndDate?: Date | null;
  stock: number;
  reservedStock?: number;
  weightKg: number;
  volumeM3: number;
  dimensions: string;
  packaging: string;
  isPreorderAllowed?: boolean;
  allowedCountries?: string[];
  leadTimeDays?: number;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
  categorySlug?: string;
}

// avoid TS-only import issues in ESM scripts
if (false) {
  const _z: ImportedProduct = {} as any;
}
