import MODEL_DB from './models.json'
import { supabase } from './config'

export { MODEL_DB }
export const BRANDS = Object.keys(MODEL_DB).sort((a, b) => a.localeCompare(b, 'es'))
export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_DISCOUNT = 25 // % mínimo bajo valor comercial para pago inmediato
export const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i)

export const CONDITIONS = [
  { id: 'excelente', label: 'Excelente, como nuevo', adj: 0.03 },
  { id: 'bueno', label: 'Bueno, uso normal', adj: 0 },
  { id: 'regular', label: 'Regular, con desgaste visible', adj: -0.08 },
  { id: 'detalles', label: 'Con choques o fallas', adj: -0.15 },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const median = (arr) => {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// Precio de referencia: depreciación exponencial entre el valor de un auto de este año (max)
// y el de uno de 12 años (min), calibrado con avisos reales de Neoauto. Más antiguo sigue bajando con piso.
export function priorValue(brand, model, year) {
  const r = MODEL_DB[brand]?.models?.[model]
  if (!r) return null
  const age = Math.max(0, CURRENT_YEAR - year)
  const t = Math.min(age, 12) / 12
  let v = r.max * Math.pow(r.min / r.max, t)
  if (age > 12) v *= Math.max(0.35, 1 - 0.05 * (age - 12))
  return v
}

// Ajuste por kilometraje frente a lo esperado (15 000 km/año).
export function kmAdjust(year, km) {
  const age = Math.max(1, CURRENT_YEAR - year)
  const expected = Math.max(8000, age * 15000)
  const delta = (km - expected) / expected
  return clamp(-delta * 0.08, -0.15, 0.06)
}

// Avisos reales (ap_market_listings, precio publicado) para marca/modelo y años cercanos,
// más el precio manual que hayas fijado en el admin (ap_price_overrides).
export async function fetchMarket(brand, model, year) {
  if (!brand || !model) return { listings: [], override: null }
  const [l, o] = await Promise.all([
    supabase
      .from('ap_market_listings')
      .select('price_usd,year,km')
      .ilike('brand', brand)
      .ilike('model', `${model}%`)
      .gte('year', year - 1)
      .lte('year', year + 1)
      .gt('price_usd', 1000)
      .order('scraped_at', { ascending: false })
      .limit(200),
    supabase
      .from('ap_price_overrides')
      .select('price_usd,year_from,year_to')
      .eq('active', true)
      .ilike('brand', brand)
      .ilike('model', model)
      .lte('year_from', year)
      .gte('year_to', year)
      .limit(1),
  ])
  return { listings: l.data || [], override: o.data?.[0] || null }
}

export function valuate({ brand, model, year, km, condition = 'bueno', market = {}, cfg }) {
  const catalog = priorValue(brand, model, year)
  if (!catalog) return null
  // Un precio manual del admin pesa más que el catálogo genérico.
  const override = market.override ? Number(market.override.price_usd) : null
  const prior = override ? override * 0.85 + catalog * 0.15 : catalog
  const prices = (market.listings || []).map((m) => Number(m.price_usd)).filter(Boolean)
  // Descartar extremos (fuera de 0.5x–1.8x de la mediana)
  const med0 = median(prices)
  const clean = med0 ? prices.filter((p) => p > med0 * 0.5 && p < med0 * 1.8) : []
  const n = clean.length
  // Precio publicado → precio de cierre real (~7% de negociación)
  const marketMed = n ? median(clean) * 0.93 : null
  const w = marketMed ? Math.min(n / 8, 1) * 0.75 : 0
  const base = marketMed ? marketMed * w + prior * (1 - w) : prior

  const cond = CONDITIONS.find((c) => c.id === condition)?.adj ?? 0
  const marketValue = base * (1 + kmAdjust(year, km)) * (1 + cond)

  const origin = MODEL_DB[brand]?.origin || ''
  const penaltyPct = cfg?.penalties?.[origin] ?? 0
  // Regla de negocio: la oferta de pago inmediato va como mínimo 25% bajo el valor comercial.
  // El castigo por origen se aplica encima de ese 25%.
  const discPct = Math.max(MIN_DISCOUNT, cfg?.margin?.pct ?? MIN_DISCOUNT)
  const minUsd = cfg?.margin?.minUsd ?? 0
  const afterDiscount = marketValue * (1 - discPct / 100) * (1 - penaltyPct / 100)
  const offer = Math.max(0, Math.min(afterDiscount, marketValue - minUsd))

  const confidence = n >= 8 || (override && n >= 3) ? 'alta' : n >= 3 || override ? 'media' : 'baja'
  const spread = confidence === 'alta' ? 0.03 : confidence === 'media' ? 0.05 : 0.08

  return {
    catalog,
    override,
    prior,
    marketMed,
    samples: n,
    weightMarket: w,
    marketValue,
    origin,
    penaltyPct,
    offer,
    discPct,
    // El techo del rango nunca supera la oferta con 25% de descuento
    offerLow: offer * (1 - spread),
    offerHigh: offer,
    margin: marketValue - offer,
    confidence,
  }
}
