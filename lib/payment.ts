// ─────────────────────────────────────────────────────────────────────────────
// GhostWrite pricing — built for Southern African students.
//
// Near-zero marginal cost (BYO Groq key, free CrossRef, free detector tiers) means
// we price low and win on volume + segments. Local currency, local rails, and a
// one-time Semester Pass that fits the academic calendar and mobile-money reality.
//
// Packages start at the Monthly tier; Free is the acquisition funnel (handled in UI).
// ─────────────────────────────────────────────────────────────────────────────

export type Market   = 'BW' | 'ZA' | 'NA' | 'ZM' | 'ZW' | 'OTHER'
export type Currency = 'BWP' | 'ZAR' | 'NAD' | 'ZMW' | 'USD'
export type Provider = 'dpo' | 'paystack'
export type TierId   = 'monthly' | 'semester' | 'annual' | 'pro'

export const MARKETS: Record<Market, {
  currency: Currency; symbol: string; provider: Provider; rails: string; label: string
}> = {
  BW:    { currency: 'BWP', symbol: 'P',   provider: 'dpo',      rails: 'Orange Money · MyZaka · Card',     label: 'Botswana' },
  ZA:    { currency: 'ZAR', symbol: 'R',   provider: 'paystack', rails: 'Instant EFT · Capitec Pay · Card', label: 'South Africa' },
  NA:    { currency: 'NAD', symbol: 'N$',  provider: 'dpo',      rails: 'Card · e-Wallet',                  label: 'Namibia' },
  ZM:    { currency: 'ZMW', symbol: 'K',   provider: 'dpo',      rails: 'Airtel · MTN Money · Card',        label: 'Zambia' },
  ZW:    { currency: 'USD', symbol: '$',   provider: 'dpo',      rails: 'EcoCash · USD · Card',             label: 'Zimbabwe' },
  OTHER: { currency: 'USD', symbol: '$',   provider: 'paystack', rails: 'Card',                            label: 'Other' },
}

// Price per market per tier, in major currency units.
// Monthly is anchored to Botswana P80 (~US$5.9) and converted at current FX so
// every market pays the same real price. Semester/annual/pro left at prior values.
export const PRICES: Record<Market, Record<TierId, number>> = {
  BW:    { monthly: 80,  semester: 129, annual: 349, pro: 199 },
  ZA:    { monthly: 109, semester: 199, annual: 549, pro: 149 },
  NA:    { monthly: 109, semester: 199, annual: 549, pro: 149 },
  ZM:    { monthly: 159, semester: 269, annual: 729, pro: 199 },
  ZW:    { monthly: 6,   semester: 10,  annual: 27,  pro: 8   },
  OTHER: { monthly: 6,   semester: 14,  annual: 39,  pro: 10  },
}

export const TIERS: {
  id: TierId; name: string; cadence: string; months: number
  audience: 'student' | 'pro'; popular?: boolean; blurb: string
}[] = [
  { id: 'monthly',  name: 'Student Monthly', cadence: '/mo',        months: 1,  audience: 'student', blurb: 'Full access, billed monthly.' },
  { id: 'semester', name: 'Semester Pass',   cadence: '/ 5 months', months: 5,  audience: 'student', popular: true, blurb: 'One payment, sorted for the term.' },
  { id: 'annual',   name: 'Student Annual',  cadence: '/yr',        months: 12, audience: 'student', blurb: 'Best value — the whole year.' },
  { id: 'pro',      name: 'Professional',    cadence: '/mo',        months: 1,  audience: 'pro',     blurb: 'For researchers & professionals.' },
]

const COUNTRY_TO_MARKET: Record<string, Market> = {
  BW: 'BW', ZA: 'ZA', NA: 'NA', ZM: 'ZM', ZW: 'ZW',
}

export function getMarket(country?: string | null): Market {
  return COUNTRY_TO_MARKET[(country || '').toUpperCase()] || 'OTHER'
}

export function getCurrency(country?: string | null): Currency {
  return MARKETS[getMarket(country)].currency
}

export function getProvider(country?: string | null): Provider {
  return MARKETS[getMarket(country)].provider
}

export function getPrice(country: string | null | undefined, tier: TierId): number {
  return PRICES[getMarket(country)][tier]
}

export function formatPrice(country: string | null | undefined, tier: TierId): string {
  const m = MARKETS[getMarket(country)]
  return `${m.symbol}${getPrice(country, tier)}`
}

export function tierMeta(tier: TierId) {
  return TIERS.find(t => t.id === tier)!
}

// Free tier (acquisition) — described in the UI, never charged.
export const FREE_TIER = {
  name: 'Free',
  blurb: 'Get started — no card needed.',
  features: ['1,500 words / month', 'Live detector gauge', '3 citations / day', 'Watermarked exports'],
}

export const PLAN_NAME = 'GhostWrite'
