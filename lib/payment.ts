// GhostWrite payment integration
// Primary:  DPO Pay  — Botswana, Orange Money, MyZaka, VISA/MC
// Fallback: Paystack — South Africa, Kenya, Ghana, Nigeria

export const PLAN = {
  name:        'GhostWrite Pro',
  price_bwp:   80,
  price_zar:   80,
  price_kes:   600,
  price_ngn:   5000,
  price_usd:   6,
  description: 'GhostWrite Pro — Unlimited words, all features, Africa Suite',
}

export type Currency = 'BWP' | 'ZAR' | 'KES' | 'NGN' | 'USD'

export function getAmount(currency: Currency): number {
  const map: Record<Currency, number> = {
    BWP: PLAN.price_bwp, ZAR: PLAN.price_zar, KES: PLAN.price_kes,
    NGN: PLAN.price_ngn, USD: PLAN.price_usd,
  }
  return map[currency] ?? PLAN.price_usd
}

export function getProvider(country: string): 'dpo' | 'paystack' {
  const dpoPrimary      = ['BW','NA','ZW','ZM','MZ','TZ','UG','RW','ET']
  const paystackPrimary = ['ZA','NG','GH','KE']
  if (dpoPrimary.includes(country))      return 'dpo'
  if (paystackPrimary.includes(country)) return 'paystack'
  return 'dpo'
}

export function getCurrency(country: string): Currency {
  const map: Record<string,Currency> = {
    BW:'BWP', ZA:'ZAR', KE:'KES', NG:'NGN', NA:'ZAR', ZW:'USD', ZM:'USD', GH:'USD',
  }
  return map[country] ?? 'USD'
}
