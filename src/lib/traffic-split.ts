export interface WeightedVariant {
  id: string;
  traffic_weight: number;
}

/**
 * Select a variant based on weighted random distribution.
 * Weights don't need to sum to 100 — they're treated as relative.
 */
export function selectVariant(variants: WeightedVariant[]): string | null {
  const activeVariants = variants.filter((v) => v.traffic_weight > 0);
  if (activeVariants.length === 0) return null;
  if (activeVariants.length === 1) return activeVariants[0].id;

  const totalWeight = activeVariants.reduce((sum, v) => sum + v.traffic_weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of activeVariants) {
    random -= variant.traffic_weight;
    if (random <= 0) return variant.id;
  }

  return activeVariants[activeVariants.length - 1].id;
}
