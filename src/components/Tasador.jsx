import { useEffect, useMemo, useRef, useState } from 'react'
import { BRANDS, MODEL_DB, CONDITIONS, CURRENT_YEAR, valuate, fetchMarket } from '../lib/valuation'
import { usd, wa, submitLead } from '../lib/config'
import { track } from '../lib/track'
import { Lock, WhatsApp, Check, Clock } from './Icons'

const POPULAR = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'Suzuki', 'Mazda', 'Mitsubishi', 'Honda', 'Chevrolet', 'Volkswagen', 'Subaru']
const KM = [
  { label: 'Menos de 30 mil', v: 20000 },
  { label: '30 a 60 mil', v: 45000 },
  { label: '60 a 100 mil', v: 80000 },
  { label: '100 a 150 mil', v: 125000 },
  { label: 'Más de 150 mil', v: 175000 },
]
const COND_HELP = {
  excelente: 'Sin choques, sin rayones, mantenimiento en concesionario.',
  bueno: 'Detalles menores de uso diario. Todo funciona.',
  regular: 'Rayones o abolladuras visibles, llantas por cambiar.',
  detalles: 'Choque reparado, falla mecánica o luz de alerta.',
}
const STEPS = ['marca', 'modelo', 'año', 'km', 'estado']
const LOCK_H = 48
const round100 = (n) => Math.round(n / 100) * 100

function Countdown({ until }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ms = Math.max(0, until - now)
  const h = String(Math.floor(ms / 36e5)).padStart(2, '0')
  const m = String(Math.floor((ms % 36e5) / 6e4)).padStart(2, '0')
  const s = String(Math.floor((ms % 6e4) / 1e3)).padStart(2, '0')
  return (
    <span className="countdown" aria-label={`Quedan ${h} horas y ${m} minutos`}>
      {h}:{m}:{s}
    </span>
  )
}

export default function Tasador({ cfg }) {
  const [step, setStep] = useState(0) // 0..4 pasos, 5 resultado
  const [f, setF] = useState({ brand: '', model: '', year: null, km: null, condition: '' })
  const [q, setQ] = useState('')
  const [kmText, setKmText] = useState('')
  const [market, setMarket] = useState({})
  const [c, setC] = useState({ name: '', phone: '' })
  const [lockedUntil, setLockedUntil] = useState(null)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const started = useRef(false)
  const top = useRef(null)

  const go = (k, v, next = true) => {
    if (!started.current) {
      started.current = true
      track('tasador_start', { step: 'marca' })
    }
    setF((p) => ({ ...p, [k]: v, ...(k === 'brand' ? { model: '' } : {}) }))
    track('step_complete', { step: STEPS[step], value: String(v).slice(0, 40) })
    setQ('')
    if (next) setStep((s) => s + 1)
  }

  useEffect(() => {
    if (step > 0 && top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  useEffect(() => {
    let live = true
    if (f.brand && f.model && f.year) fetchMarket(f.brand, f.model, f.year).then((m) => live && setMarket(m))
    return () => {
      live = false
    }
  }, [f.brand, f.model, f.year])

  const v = useMemo(
    () => (step === 5 && f.model ? valuate({ ...f, km: f.km ?? 0, market, cfg }) : null),
    [step, f, market, cfg],
  )
  useEffect(() => {
    if (v) track('quote_shown', { brand: f.brand, model: f.model, year: f.year, offer: round100(v.offer), confidence: v.confidence })
  }, [v?.offer]) // eslint-disable-line

  const brands = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (q && !t) return BRANDS
    return t ? BRANDS.filter((b) => b.toLowerCase().includes(t)) : POPULAR
  }, [q])
  const models = useMemo(() => {
    const all = Object.keys(MODEL_DB[f.brand]?.models || {}).sort((a, b) => a.localeCompare(b, 'es'))
    const t = q.trim().toLowerCase()
    return t ? all.filter((m) => m.toLowerCase().includes(t)) : all
  }, [f.brand, q])
  const years = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - i)

  const vehicle = `${f.brand} ${f.model} ${f.year ?? ''}`.trim()
  const low = v ? round100(v.offerLow) : 0
  const high = v ? round100(v.offerHigh) : 0

  const lock = async (e) => {
    e.preventDefault()
    setErr('')
    const phone = c.phone.replace(/\D/g, '')
    if (c.name.trim().length < 2) return setErr('Escribe tu nombre.')
    if (phone.length !== 9 || phone[0] !== '9') return setErr('El celular debe tener 9 dígitos y empezar con 9.')
    setSending(true)
    const until = Date.now() + LOCK_H * 36e5
    await submitLead(
      'compramos',
      {
        name: c.name.trim(),
        phone: '+51' + phone,
        brand: f.brand,
        model: f.model,
        year: f.year,
        km: f.km,
        condition: f.condition,
        mode: 'compramos',
        priceLockedUntil: new Date(until).toISOString(),
        valuation: v && { marketValue: Math.round(v.marketValue), offerLow: low, offerHigh: high, samples: v.samples, confidence: v.confidence },
      },
      { offer_usd: v ? round100(v.offer) : null, market_value_usd: v ? Math.round(v.marketValue) : null },
    )
    track('lead_submitted', { brand: f.brand, model: f.model, offer: high })
    setSending(false)
    setLockedUntil(until)
  }

  const waMsg = [
    `Hola AutoPago, soy ${c.name.trim()}. Congelé mi pre-oferta en la web:`,
    `• ${vehicle}, ${(f.km || 0).toLocaleString('es-PE')} km aprox.`,
    `• Estado: ${CONDITIONS.find((x) => x.id === f.condition)?.label || ''}`,
    `• Pre-oferta: US$ ${low.toLocaleString('en-US')} – ${high.toLocaleString('en-US')}`,
    '¿Cuándo pueden revisarlo?',
  ].join('\n')

  const Back = () => (
    <button type="button" className="linkbtn" onClick={() => setStep((s) => Math.max(0, s - 1))}>
      ← Volver
    </button>
  )

  return (
    <div className="quote" id="tasar" ref={top}>
      {step < 5 && (
        <>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2>¿Cuánto vale tu auto?</h2>
            <span className="small muted">Paso {step + 1} de 5</span>
          </div>
          <div className="quote-steps" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? 'on' : ''} />
            ))}
          </div>
          {step > 0 && (
            <div className="crumbs">
              {[f.brand, f.model, f.year, f.km != null && KM.find((k) => k.v === f.km)?.label].filter(Boolean).map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {step === 0 && (
        <div className="stack">
          <label className="q-label" htmlFor="t-q">
            ¿Qué marca es?
          </label>
          <input id="t-q" className="input" placeholder="Busca tu marca" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          <div className="opts">
            {brands.map((b) => (
              <button key={b} className="opt" onClick={() => go('brand', b)}>
                {b}
              </button>
            ))}
            {!q && (
              <button className="opt ghost" onClick={() => setQ(' ')}>
                Otra marca
              </button>
            )}
          </div>
          {q && brands.length === 0 && <p className="small muted">No encontramos esa marca. Escríbenos por WhatsApp y te cotizamos igual.</p>}
        </div>
      )}

      {step === 1 && (
        <div className="stack">
          <label className="q-label" htmlFor="t-qm">
            ¿Qué modelo de {f.brand}?
          </label>
          {Object.keys(MODEL_DB[f.brand]?.models || {}).length > 10 && (
            <input id="t-qm" className="input" placeholder="Busca tu modelo" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          )}
          <div className="opts">
            {models.map((m) => (
              <button key={m} className="opt" onClick={() => go('model', m)}>
                {m}
              </button>
            ))}
          </div>
          <Back />
        </div>
      )}

      {step === 2 && (
        <div className="stack">
          <span className="q-label">¿De qué año es?</span>
          <div className="opts years">
            {years.map((y) => (
              <button key={y} className="opt" onClick={() => go('year', y)}>
                {y}
              </button>
            ))}
          </div>
          <select className="select" aria-label="Año anterior" defaultValue="" onChange={(e) => e.target.value && go('year', +e.target.value)}>
            <option value="">Es más antiguo</option>
            {Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 15 - i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <Back />
        </div>
      )}

      {step === 3 && (
        <div className="stack">
          <span className="q-label">¿Cuántos kilómetros tiene?</span>
          <div className="opts cols">
            {KM.map((k) => (
              <button key={k.v} className="opt" onClick={() => go('km', k.v)}>
                {k.label}
              </button>
            ))}
          </div>
          <form
            className="row"
            style={{ flexWrap: 'nowrap' }}
            onSubmit={(e) => {
              e.preventDefault()
              const n = +kmText.replace(/\D/g, '')
              if (n > 0) go('km', n)
            }}
          >
            <input className="input" inputMode="numeric" aria-label="Kilometraje exacto" placeholder="O escribe el número exacto" value={kmText} onChange={(e) => setKmText(e.target.value)} />
            <button className="btn btn-ghost btn-sm" disabled={!kmText}>
              Listo
            </button>
          </form>
          <Back />
        </div>
      )}

      {step === 4 && (
        <div className="stack">
          <span className="q-label">¿En qué estado está?</span>
          <div className="conds">
            {CONDITIONS.map((x) => (
              <button key={x.id} className="cond" onClick={() => go('condition', x.id)}>
                <b>{x.label}</b>
                <span>{COND_HELP[x.id]}</span>
              </button>
            ))}
          </div>
          <Back />
        </div>
      )}

      {step === 5 && v && (
        <div className="stack">
          <div>
            <span className="small muted">
              {vehicle} · {(f.km || 0).toLocaleString('es-PE')} km
            </span>
            <button type="button" className="linkbtn" style={{ marginLeft: 8 }} onClick={() => { setStep(0); setLockedUntil(null) }}>
              Cambiar
            </button>
          </div>
          <div className="result on reveal">
            <div className="result-label">{lockedUntil ? 'Tu precio congelado' : 'Te pagamos hoy entre'}</div>
            <div className="result-num">
              US$ {low.toLocaleString('en-US')} – {high.toLocaleString('en-US')}
            </div>
            <div className="result-cap">
              {v.samples >= 3 ? `Calculado con ${v.samples} autos similares a la venta hoy en Lima.` : 'Referencia de mercado. La confirmamos al ver el auto.'}
            </div>
          </div>

          {!lockedUntil ? (
            <form className="stack lockbox" onSubmit={lock} onFocus={() => track('lock_click', { step: 'lock' })}>
              <div className="row" style={{ gap: 8 }}>
                <Clock width="18" height="18" style={{ color: 'var(--brand)' }} />
                <b>Congela este precio por 48 horas</b>
              </div>
              <div className="grid2 keep">
                <input className="input" aria-label="Tu nombre" placeholder="Tu nombre" autoComplete="given-name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
                <input className="input" aria-label="Celular" placeholder="Celular" inputMode="tel" autoComplete="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
              </div>
              {err && <p className="err">{err}</p>}
              <button className="btn btn-signal btn-block" disabled={sending}>
                {sending ? 'Congelando…' : 'Congelar mi precio'}
              </button>
              <p className="secure">
                <Lock /> Sin compromiso. Solo te escribimos por este auto.
              </p>
            </form>
          ) : (
            <div className="stack lockbox on">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>Precio congelado</b>
                <Countdown until={lockedUntil} />
              </div>
              <p className="small muted">Un asesor te escribe en menos de 2 horas para coordinar la revisión gratis en tu casa.</p>
              <a className="btn btn-wa btn-block" href={wa(cfg.whatsapp, waMsg)} target="_blank" rel="noreferrer" onClick={() => track('wa_open', { step: 'locked' })}>
                <WhatsApp /> Coordinar ahora por WhatsApp
              </a>
            </div>
          )}

          <details className="why">
            <summary>¿Por qué vender con AutoPago y no por mi cuenta?</summary>
            <table className="cmp">
              <thead>
                <tr>
                  <th />
                  <th>Por tu cuenta</th>
                  <th>AutoPago</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tiempo para vender', '4 a 8 semanas', 'Hoy mismo'],
                  ['Regateo', 'Con cada interesado', 'Ninguno'],
                  ['Visitas de desconocidos', 'Muchas', 'Ninguna'],
                  ['Riesgo de estafa', 'Alto', 'Cero, pagamos al firmar'],
                  ['Trámites y notaría', 'Tú', 'Nosotros'],
                  ['Deuda con el banco', 'Tú la cancelas', 'La pagamos por ti'],
                ].map(([k, a, b]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td className="muted">{a}</td>
                    <td>
                      <Check width="16" height="16" style={{ color: 'var(--brand)', verticalAlign: '-3px' }} /> {b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
      {step === 5 && !v && <p className="muted">Calculando…</p>}
    </div>
  )
}
