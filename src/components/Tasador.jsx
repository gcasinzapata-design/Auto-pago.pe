import { useEffect, useMemo, useState } from 'react'
import { BRANDS, MODEL_DB, YEARS, CONDITIONS, CURRENT_YEAR, valuate, fetchMarket } from '../lib/valuation'
import { usd, wa, submitLead } from '../lib/config'
import { Plate } from './Shell'

export default function Tasador({ cfg }) {
  const [f, setF] = useState({ brand: '', model: '', year: CURRENT_YEAR - 4, km: 50000, condition: 'bueno' })
  const [market, setMarket] = useState({})
  const [step, setStep] = useState('auto') // auto → contacto → enviado
  const [c, setC] = useState({ name: '', phone: '', plate: '', debt: 'no' })
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v, ...(k === 'brand' ? { model: '' } : {}) }))

  const models = useMemo(() => Object.keys(MODEL_DB[f.brand]?.models || {}).sort(), [f.brand])

  useEffect(() => {
    let live = true
    if (f.brand && f.model) fetchMarket(f.brand, f.model, +f.year).then((m) => live && setMarket(m))
    else setMarket({})
    return () => {
      live = false
    }
  }, [f.brand, f.model, f.year])

  const v = useMemo(
    () => (f.brand && f.model ? valuate({ ...f, year: +f.year, km: +f.km, market, cfg }) : null),
    [f, market, cfg],
  )

  const vehicle = `${f.brand} ${f.model} ${f.year}`
  const send = async (e) => {
    e.preventDefault()
    setErr('')
    const phone = c.phone.replace(/\D/g, '')
    if (c.name.trim().length < 2) return setErr('Escribe tu nombre.')
    if (phone.length !== 9 || phone[0] !== '9') return setErr('El celular debe tener 9 dígitos y empezar con 9.')
    setSending(true)
    await submitLead(
      'compramos',
      {
        name: c.name.trim(),
        phone: '+51' + phone,
        brand: f.brand,
        model: f.model,
        year: +f.year,
        km: +f.km,
        condition: f.condition,
        plate: c.plate.toUpperCase(),
        debt: c.debt,
        mode: 'compramos',
        valuation: v && {
          marketValue: Math.round(v.marketValue),
          offerLow: Math.round(v.offerLow),
          offerHigh: Math.round(v.offerHigh),
          samples: v.samples,
          confidence: v.confidence,
        },
      },
      { offer_usd: v ? Math.round(v.offer) : null, market_value_usd: v ? Math.round(v.marketValue) : null },
    )
    setSending(false)
    setStep('enviado')
    const msg = [
      `Hola AutoPago, soy ${c.name.trim()}. Quiero vender mi auto:`,
      `• ${vehicle}, ${(+f.km).toLocaleString('es-PE')} km`,
      `• Estado: ${CONDITIONS.find((x) => x.id === f.condition)?.label}`,
      c.plate && `• Placa: ${c.plate.toUpperCase()}`,
      `• ¿Tiene deuda?: ${c.debt === 'si' ? 'Sí' : 'No'}`,
      v && `• Pre-oferta web: ${usd(v.offerLow)} – ${usd(v.offerHigh)}`,
    ]
      .filter(Boolean)
      .join('\n')
    window.open(wa(cfg.whatsapp, msg), '_blank')
  }

  return (
    <div className="quote" id="tasar">
      <h2>¿Cuánto te pagamos por tu auto?</h2>
      <p className="muted small" style={{ marginBottom: 18 }}>
        Pre-oferta al instante con precios reales del mercado de Lima. La oferta final llega por WhatsApp en menos de 2 horas.
      </p>

      {step === 'auto' && (
        <div className="stack">
          <div className="grid2">
            <div className="field">
              <label htmlFor="t-brand">Marca</label>
              <select id="t-brand" className="select" value={f.brand} onChange={(e) => set('brand', e.target.value)}>
                <option value="">Elige la marca</option>
                {BRANDS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-model">Modelo</label>
              <select id="t-model" className="select" value={f.model} disabled={!f.brand} onChange={(e) => set('model', e.target.value)}>
                <option value="">{f.brand ? 'Elige el modelo' : 'Primero la marca'}</option>
                {models.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-year">Año</label>
              <select id="t-year" className="select" value={f.year} onChange={(e) => set('year', e.target.value)}>
                {YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-km">Kilometraje</label>
              <input id="t-km" className="input" type="number" inputMode="numeric" min="0" step="1000" value={f.km} onChange={(e) => set('km', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="t-cond">Estado</label>
            <select id="t-cond" className="select" value={f.condition} onChange={(e) => set('condition', e.target.value)}>
              {CONDITIONS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <Plate
            empty={!v}
            revealKey={v ? Math.round(v.offer / 100) : 'e'}
            value={v ? `$${(Math.round(v.offerLow / 100) * 100).toLocaleString('en-US')} – ${(Math.round(v.offerHigh / 100) * 100).toLocaleString('en-US')}` : '$ —'}
            caption={
              v
                ? `Pre-oferta en dólares para tu ${vehicle}` + (v.samples ? `, comparado con ${v.samples} avisos similares` : '')
                : 'Completa marca y modelo para ver tu pre-oferta'
            }
          />
          <button className="btn btn-signal" disabled={!v} onClick={() => setStep('contacto')}>
            Recibir oferta final por WhatsApp
          </button>
        </div>
      )}

      {step === 'contacto' && (
        <form className="stack" onSubmit={send}>
          <p>
            <strong>{vehicle}</strong> · pre-oferta {usd(v?.offerLow)} – {usd(v?.offerHigh)}
          </p>
          <div className="field">
            <label htmlFor="c-name">Tu nombre</label>
            <input id="c-name" className="input" autoComplete="name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="c-phone">Celular</label>
              <input id="c-phone" className="input" inputMode="tel" placeholder="9XX XXX XXX" autoComplete="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="c-plate">Placa (opcional)</label>
              <input id="c-plate" className="input" placeholder="ABC-123" value={c.plate} onChange={(e) => setC({ ...c, plate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="c-debt">¿El auto tiene deuda con un banco?</label>
            <select id="c-debt" className="select" value={c.debt} onChange={(e) => setC({ ...c, debt: e.target.value })}>
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </div>
          {err && <p className="err">{err}</p>}
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep('auto')}>
              Volver
            </button>
            <button className="btn btn-wa" disabled={sending}>
              {sending ? 'Enviando…' : 'Enviar por WhatsApp'}
            </button>
          </div>
        </form>
      )}

      {step === 'enviado' && (
        <div className="stack">
          <Plate value="Recibido" caption="Te escribimos por WhatsApp con la oferta final en menos de 2 horas." revealKey="ok" />
          <button className="btn btn-ghost" onClick={() => setStep('auto')}>
            Tasar otro auto
          </button>
        </div>
      )}
    </div>
  )
}
