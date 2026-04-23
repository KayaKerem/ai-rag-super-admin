export type ProviderBand = 'healthy' | 'watch' | 'action'
export type EstimateBand = 'healthy' | 'watch' | 'action'

// Sınır davranışı: >= inclusive. 90.0 → healthy, 89.9 → watch, 70.0 → watch, 69.9 → action.
export function getProviderBand(providerPct: number): ProviderBand {
  if (providerPct >= 90) return 'healthy'
  if (providerPct >= 70) return 'watch'
  return 'action'
}

// Düşük estimate = sağlıklı. 10.0 → healthy, 10.1 → watch, 30.0 → watch, 30.1 → action.
export function getEstimateBand(estimatePct: number): EstimateBand {
  if (estimatePct <= 10) return 'healthy'
  if (estimatePct <= 30) return 'watch'
  return 'action'
}

export const BAND_CLASSES: Record<ProviderBand, string> = {
  healthy: 'text-green-700 bg-green-50 border-green-200',
  watch: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  action: 'text-red-700 bg-red-50 border-red-200',
}
