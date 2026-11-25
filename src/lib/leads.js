import { MODEL_DB, CURRENT_YEAR } from './valuation'

export const STAGES = [
  { id: 'nuevo', label: 'Nuevo' },
  { id: 'contactado', label: 'Contactado' },
  { id: 'ofertado', label: 'Ofertado' },
  { id: 'inspeccion', label: 'Inspección' },
  { id: 'cerrado', label: 'Comprado' },
  { id: 'perdido', label: 'Perdido' },
]
export const TIERS = ['ALTA', 'MEDIA', 'REVISAR', 'DESCARTAR']

const TYPE_LABEL = {
  compramos: 'Compra',
  comprar_quote: 'Compra',
  comprar_whatsapp: 'Compra',
  consigna: 'Consignación',
  consigna_quote: 'Consignación',
  prestamos: 'Préstamo',
  credito_quote: 'Préstamo',
  credito_whatsapp: 'Préstamo',
  seminuevo: 'Seminuevo',
}
export const typeGroup = (t) => TYPE_LABEL[t] || t || 'Otro'

export function leadInfo(l) {
  const p = l.payload || {}
  const vehicle = p.vehicle || [p.brand, p.model, p.year].filter(Boolean).join(' ')
  const phone = (p.phone || '').replace(/\D/g, '')
  return {
    name: p.name || 'Sin nombre',
    phone,
    email: p.email || '',
    vehicle: vehicle || 'Auto sin datos',
    brand: p.brand,
    model: p.model,
    year: p.year ? +p.year : null,
    km: p.km ? +p.km : null,
    group: typeGroup(l.type),
    amount: p.loanAmt ? `S/ ${(+p.loanAmt).toLocaleString('es-PE')}` : p.consignaPrice ? `US$ ${(+p.consignaPrice).toLocaleString('es-PE')}` : null,
    p,
  }
}

// Calificación sugerida (misma lógica que los tiers ALTA/MEDIA/REVISAR/DESCARTAR)
export function suggestTier(l) {
  const i = leadInfo(l)
  if (i.phone.length < 9) return 'DESCARTAR'
  if (i.group === 'Préstamo' || i.group === 'Consignación' || i.group === 'Seminuevo') return 'MEDIA'
  if (!i.brand || !i.year) return 'REVISAR'
  const origin = MODEL_DB[i.brand]?.origin
  const age = CURRENT_YEAR - i.year
  if (age > 15) return 'DESCARTAR'
  if ((origin === 'japones' || origin === 'coreano') && age <= 8 && (!i.km || i.km < 150000)) return 'ALTA'
  if (origin === 'chino' && age > 6) return 'REVISAR'
  return age <= 11 ? 'MEDIA' : 'REVISAR'
}

export const ago = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `hace ${Math.max(1, Math.round(s / 60))} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  return `hace ${Math.round(s / 86400)} d`
}
