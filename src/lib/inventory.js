import { supabase, fixImgUrl } from './config'

export const parseImages = (row) => {
  let imgs = []
  try {
    imgs = typeof row.images === 'string' ? JSON.parse(row.images) : Array.isArray(row.images) ? row.images : []
  } catch {
    imgs = []
  }
  if (!imgs.length && row.img) imgs = [row.img]
  return imgs.map(fixImgUrl).filter(Boolean)
}

export const mapCar = (r) => ({
  id: r.id,
  brand: r.brand,
  model: r.model,
  year: r.year,
  km: r.km,
  fuel: r.fuel,
  trans: r.transmission,
  color: r.color,
  price: Number(r.price_usd) || 0,
  status: r.status || 'disponible',
  images: parseImages(r),
  sortOrder: r.sort_order || 0,
  wholesale: !!r.wholesale,
  wholesalePrice: Number(r.wholesale_price_usd) || null,
  minBid: Number(r.min_bid_usd) || null,
  auctionEndsAt: r.auction_ends_at,
  costUsd: Number(r.cost_usd) || null,
  notes: r.notes || '',
  raw: r,
})

export const toRow = (c) => ({
  brand: c.brand,
  model: c.model,
  year: c.year ? +c.year : null,
  km: c.km ? +c.km : null,
  fuel: c.fuel || null,
  transmission: c.trans || null,
  color: c.color || null,
  price_usd: c.price ? +c.price : null,
  status: c.status,
  img: c.images?.[0] || '',
  images: JSON.stringify(c.images || []),
  updated_at: new Date().toISOString(),
})

// Costo y datos mayoristas viven en ap_inventory_private (solo admin)
export const toPrivate = (id, c) => ({
  inventory_id: id,
  wholesale: !!c.wholesale,
  wholesale_price_usd: c.wholesalePrice ? +c.wholesalePrice : null,
  min_bid_usd: c.minBid ? +c.minBid : null,
  auction_ends_at: c.auctionEndsAt ? new Date(c.auctionEndsAt).toISOString() : null,
  cost_usd: c.costUsd ? +c.costUsd : null,
  notes: c.notes || null,
  updated_at: new Date().toISOString(),
})

export async function loadPublicInventory() {
  const { data } = await supabase.from('ap_inventory').select('*').neq('status', 'vendido').order('sort_order')
  return (data || []).map(mapCar).filter((c) => c.price > 0)
}

export async function loadAdminInventory() {
  const [{ data: inv }, { data: priv }] = await Promise.all([
    supabase.from('ap_inventory').select('*').order('sort_order'),
    supabase.from('ap_inventory_private').select('*'),
  ])
  const p = Object.fromEntries((priv || []).map((r) => [r.inventory_id, r]))
  return (inv || []).map((r) => mapCar({ ...r, ...(p[r.id] || {}), id: r.id }))
}
