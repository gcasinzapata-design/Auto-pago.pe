import { createClient } from '@supabase/supabase-js'

// La anon key es pública por diseño; la seguridad la dan las políticas RLS.
export const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ueleianrtxaupxwuzxnm.supabase.co'
export const SB_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGVpYW5ydHhhdXB4d3V6eG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTkyNjEsImV4cCI6MjA4ODM5NTI2MX0.jriKraTXmbyuVzbMyM0sSCkT7a5dEC3qrPQxDAfkCmY'

export const supabase = createClient(SB_URL, SB_KEY)

export const MAKE_HOOK = 'https://hook.us2.make.com/np34lh4ygdwh62r8z6t9833d0k18jkzs'

export const DEFAULT_CFG = {
  whatsapp: '51970625242',
  commission: 5,
  baseTEA: 26,
  modules: { compramos: true, consigna: true, prestamos: true, seminuevos: true },
  penalties: { japones: 0, coreano: 5, chino: 20, americano: 10, europeo: 5 },
  margin: { pct: 7, minUsd: 900 },
}

export const wa = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`

export const usd = (n) =>
  n == null || isNaN(n) ? '—' : 'US$ ' + Math.round(n).toLocaleString('es-PE')

export const fixImgUrl = (u) => {
  if (!u) return ''
  const m = u.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return m ? 'https://lh3.googleusercontent.com/d/' + m[1] : u
}

export async function loadConfig() {
  const { data } = await supabase.from('ap_admin_config').select('config').eq('id', 1).maybeSingle()
  const c = data?.config || {}
  const mods = c.modules || {}
  return {
    ...DEFAULT_CFG,
    whatsapp: c.general?.whatsappNumber || DEFAULT_CFG.whatsapp,
    commission: c.consigna?.commissionPct ? c.consigna.commissionPct * 100 : DEFAULT_CFG.commission,
    penalties: { ...DEFAULT_CFG.penalties, ...(c.penalties || {}) },
    margin: { ...DEFAULT_CFG.margin, ...(c.margin || {}) },
    modules: {
      compramos: mods.comprar !== false,
      consigna: mods.consigna !== false,
      prestamos: mods.credito !== false,
      seminuevos: mods.seminuevos !== false,
    },
    _raw: c,
  }
}

export async function submitLead(type, payload, extra = {}) {
  const row = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    type,
    payload,
    status: 'new',
    stage: 'nuevo',
    ...extra,
  }
  const { error } = await supabase.from('ap_leads').insert(row)
  if (error) console.error('Lead save error:', error)
  try {
    fetch(MAKE_HOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) })
  } catch {
    /* noop */
  }
  return { row, error }
}
