import { useEffect, useMemo, useState } from 'react'
import { supabase, usd } from '../../lib/config'
import { BRANDS, MODEL_DB, YEARS, CONDITIONS, CURRENT_YEAR, valuate, fetchMarket } from '../../lib/valuation'

function InternalTasador({ cfg }) {
  const [f, setF] = useState({ brand: 'Toyota', model: 'RAV4', year: CURRENT_YEAR - 5, km: 70000, condition: 'bueno' })
  const [m, setM] = useState({})
  useEffect(() => {
    if (f.brand && f.model) fetchMarket(f.brand, f.model, +f.year).then(setM)
  }, [f.brand, f.model, f.year])
  const v = useMemo(() => (f.model ? valuate({ ...f, year: +f.year, km: +f.km, market: m, cfg }) : null), [f, m, cfg])
  const models = Object.keys(MODEL_DB[f.brand]?.models || {}).sort()
  const row = (label, value, note) => (
    <tr>
      <td>{label}</td>
      <td className="num">
        <b>{value}</b>
      </td>
      <td className="small muted">{note}</td>
    </tr>
  )
  return (
    <div className="panel stack">
      <h3>Tasador interno</h3>
      <p className="small muted">Para autos que llegan por WhatsApp. El cliente nunca ve este detalle.</p>
      <div className="grid3">
        <select className="select" aria-label="Marca" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value, model: '' })}>
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select className="select" aria-label="Modelo" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}>
          <option value="">Modelo</option>
          {models.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className="select" aria-label="Año" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <input className="input" aria-label="Kilometraje" type="number" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} />
        <select className="select" aria-label="Estado" value={f.condition} onChange={(e) => setF({ ...f, condition: e.target.value })}>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {v && (
        <table className="t">
          <tbody>
            {row('Catálogo', usd(v.catalog), 'Rango del modelo ajustado por año')}
            {v.override && row('Tu precio manual', usd(v.override), 'Pesa 85% sobre el catálogo')}
            {row('Mediana de avisos', v.marketMed ? usd(v.marketMed) : '—', `${v.samples} avisos ±1 año, ya con –7% de negociación · peso ${Math.round(v.weightMarket * 100)}%`)}
            {row('Valor comercial', usd(v.marketValue), 'Ajustado por km y estado')}
            {row('Descuento pago inmediato', `${v.discPct}%`, 'Regla AutoPago: mínimo 25% bajo valor comercial')}
            {row(`Castigo ${v.origin}`, `${v.penaltyPct}%`, 'Encima del descuento · configurable en Ajustes')}
            {row('Oferta máxima', usd(v.offer), `${Math.round((1 - v.offer / v.marketValue) * 100)}% bajo valor comercial · margen bruto ${usd(v.margin)}`)}
            {row('Pre-oferta que ve el cliente', `${usd(v.offerLow)} – ${usd(v.offerHigh)}`, `Confianza ${v.confidence}`)}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Overrides() {
  const [list, setList] = useState([])
  const [f, setF] = useState({ brand: '', model: '', year_from: CURRENT_YEAR - 5, year_to: CURRENT_YEAR - 3, price_usd: '', notes: '' })
  const [err, setErr] = useState('')
  const load = () => supabase.from('ap_price_overrides').select('*').order('updated_at', { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => {
    load()
  }, [])
  const add = async () => {
    if (!f.brand || !f.model || !f.price_usd) return setErr('Completa marca, modelo y precio.')
    const { error } = await supabase.from('ap_price_overrides').insert({ ...f, price_usd: +f.price_usd, year_from: +f.year_from, year_to: +f.year_to, active: true, updated_at: new Date().toISOString() })
    if (error) return setErr(error.message)
    setErr('')
    setF({ ...f, price_usd: '', notes: '' })
    load()
  }
  const toggle = async (o) => {
    await supabase.from('ap_price_overrides').update({ active: !o.active }).eq('id', o.id)
    load()
  }
  return (
    <div className="panel stack">
      <h3>Precios manuales</h3>
      <p className="small muted">Cuando sabes el precio real de cierre de un modelo (por ventas propias o de colegas), regístralo aquí. El tasador lo usa como ancla.</p>
      <div className="grid3">
        <input className="input" aria-label="Marca" list="brands-o" placeholder="Marca" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
        <datalist id="brands-o">
          {BRANDS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        <input className="input" aria-label="Modelo" placeholder="Modelo (igual que en el catálogo)" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        <input className="input" aria-label="Precio de cierre US$" type="number" placeholder="Precio de cierre US$" value={f.price_usd} onChange={(e) => setF({ ...f, price_usd: e.target.value })} />
        <input className="input" aria-label="Desde año" type="number" value={f.year_from} onChange={(e) => setF({ ...f, year_from: e.target.value })} />
        <input className="input" aria-label="Hasta año" type="number" value={f.year_to} onChange={(e) => setF({ ...f, year_to: e.target.value })} />
        <input className="input" aria-label="Nota" placeholder="Nota (opcional)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn btn-sm" style={{ alignSelf: 'start' }} onClick={add}>
        Guardar precio
      </button>
      {list.length > 0 && (
        <table className="t">
          <tbody>
            {list.map((o) => (
              <tr key={o.id} style={{ opacity: o.active ? 1 : 0.5 }}>
                <td>
                  {o.brand} {o.model} {o.year_from}–{o.year_to}
                  {o.notes && <div className="small muted">{o.notes}</div>}
                </td>
                <td className="num">{usd(o.price_usd)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => toggle(o)}>
                    {o.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const attr = (it, id) => it.attributes?.find((a) => a.id === id)?.value_name

function Listings() {
  const [stats, setStats] = useState(null)
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [fx, setFx] = useState(3.75)
  const [brand, setBrand] = useState('Toyota')
  const [paste, setPaste] = useState('')
  const loadStats = async () => {
    const { count } = await supabase.from('ap_market_listings').select('*', { count: 'exact', head: true })
    const { data } = await supabase.from('ap_market_listings').select('scraped_at').order('scraped_at', { ascending: false }).limit(1)
    setStats({ count: count || 0, last: data?.[0]?.scraped_at })
  }
  useEffect(() => {
    loadStats()
  }, [])
  const push = (s) => setLog((l) => [s, ...l].slice(0, 60))

  const save = async (rows) => {
    if (!rows.length) return 0
    const { error } = await supabase.from('ap_market_listings').upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: false })
    if (error) push('Error al guardar: ' + error.message)
    return error ? 0 : rows.length
  }

  // Corre desde tu navegador (IP residencial), igual que el scraper de la v7.
  const runML = async () => {
    setBusy(true)
    setLog([])
    const models = Object.keys(MODEL_DB[brand].models)
    let total = 0
    for (const model of models) {
      try {
        const url = `https://api.mercadolibre.com/sites/MPE/search?category=MPE1744&q=${encodeURIComponent(brand + ' ' + model)}&limit=50`
        const r = await fetch(url)
        if (!r.ok) {
          push(`${model}: MercadoLibre respondió ${r.status}. Usa la importación manual de abajo.`)
          if (r.status === 401 || r.status === 403) break
          continue
        }
        const j = await r.json()
        const rows = (j.results || [])
          .map((it) => {
            const year = +attr(it, 'VEHICLE_YEAR') || null
            const km = parseInt((attr(it, 'KILOMETERS') || '').replace(/\D/g, '')) || null
            const usdP = it.currency_id === 'USD' ? it.price : it.price / fx
            return year && usdP > 1000
              ? { brand, model, year, km, price_usd: Math.round(usdP), price_pen: it.currency_id === 'PEN' ? it.price : Math.round(it.price * fx), transmission: attr(it, 'TRANSMISSION'), fuel: attr(it, 'FUEL_TYPE'), version: attr(it, 'TRIM'), location: it.address?.state_name || it.location?.state?.name, source: 'mercadolibre', source_id: it.id, source_url: it.permalink, scraped_at: new Date().toISOString() }
              : null
          })
          .filter(Boolean)
        const n = await save(rows)
        total += n
        push(`${model}: ${n} avisos`)
      } catch (e) {
        push(`${model}: no se pudo conectar (${e.message}).`)
      }
    }
    push(`Listo: ${total} avisos guardados.`)
    setBusy(false)
    loadStats()
  }

  // Formato: marca,modelo,año,precio_usd,km,url  (una fila por aviso)
  const importPaste = async () => {
    const rows = paste
      .split('\n')
      .map((l) => l.split(/[,;\t]/).map((x) => x.trim()))
      .filter((c) => c.length >= 4 && +c[2] > 1990 && +c[3] > 1000)
      .map((c) => ({ brand: c[0], model: c[1], year: +c[2], price_usd: +c[3], km: +c[4] || null, source_url: c[5] || null, source: 'manual', source_id: c[5] || `${c[0]}-${c[1]}-${c[2]}-${c[3]}-${c[4] || ''}`, scraped_at: new Date().toISOString() }))
    const n = await save(rows)
    push(`Importados ${n} avisos.`)
    setPaste('')
    loadStats()
  }

  return (
    <div className="panel stack">
      <h3>Avisos del mercado</h3>
      <p className="small muted">
        {stats ? `${stats.count} avisos guardados` : 'Cargando…'}
        {stats?.last && ` · última actualización ${new Date(stats.last).toLocaleDateString('es-PE')}`}. Con 8 o más avisos comparables, la pre-oferta usa el mercado real en vez del catálogo.
      </p>
      <div className="row">
        <select className="select" style={{ width: 'auto' }} aria-label="Marca a actualizar" value={brand} onChange={(e) => setBrand(e.target.value)}>
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className="row small">
          Tipo de cambio <input className="input" style={{ width: 90 }} type="number" step="0.01" value={fx} onChange={(e) => setFx(+e.target.value)} />
        </label>
        <button className="btn btn-sm" disabled={busy} onClick={runML}>
          {busy ? 'Buscando…' : 'Actualizar desde MercadoLibre'}
        </button>
      </div>
      {log.length > 0 && (
        <pre className="small" style={{ background: '#f7f8f5', padding: 10, borderRadius: 4, maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {log.join('\n')}
        </pre>
      )}
      <div className="field">
        <label htmlFor="m-paste">Importar avisos a mano (marca, modelo, año, precio US$, km, enlace)</label>
        <textarea id="m-paste" className="input" rows={4} placeholder={'Toyota,RAV4,2020,24500,61000,https://...\nHyundai,Tucson,2021,21900,45000'} value={paste} onChange={(e) => setPaste(e.target.value)} />
      </div>
      <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'start' }} disabled={!paste.trim()} onClick={importPaste}>
        Importar avisos
      </button>
    </div>
  )
}

export default function Market({ cfg }) {
  return (
    <>
      <h1>Tasación</h1>
      <div className="stack" style={{ gap: 20 }}>
        <InternalTasador cfg={cfg} />
        <Overrides />
        <Listings />
      </div>
    </>
  )
}
