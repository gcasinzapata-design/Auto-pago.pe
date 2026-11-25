import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../components/Shell'
import Tasador from '../components/Tasador'
import { usd, wa, submitLead } from '../lib/config'
import { loadPublicInventory } from '../lib/inventory'
import { FAQ } from '../lib/faq'

function Layout({ cfg, children }) {
  return (
    <>
      <Nav cfg={cfg} />
      <main>{children}</main>
      <Footer cfg={cfg} />
      <div className="sticky-cta">
        <a className="btn btn-signal" href="/#tasar">
          Tasar mi auto
        </a>
        <a className="btn btn-wa" href={wa(cfg.whatsapp, 'Hola AutoPago')} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </div>
    </>
  )
}

// Cuota francesa con TEA → TEM
const cuota = (monto, tea, meses) => {
  const tem = Math.pow(1 + tea / 100, 1 / 12) - 1
  return (monto * tem) / (1 - Math.pow(1 + tem, -meses))
}

function ServiceModal({ cfg, mode, onClose }) {
  const [f, setF] = useState({ name: '', phone: '', vehicle: '', amount: 20000, term: 24, price: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const loan = mode === 'prestamos'
  const send = async (e) => {
    e.preventDefault()
    const phone = f.phone.replace(/\D/g, '')
    if (f.name.trim().length < 2 || phone.length !== 9) return setErr('Escribe tu nombre y un celular de 9 dígitos.')
    if (!f.vehicle.trim()) return setErr('Cuéntanos qué auto tienes (marca, modelo y año).')
    setBusy(true)
    const payload = { name: f.name.trim(), phone: '+51' + phone, vehicle: f.vehicle.trim(), mode }
    if (loan) Object.assign(payload, { loanAmt: +f.amount, loanTerm: +f.term })
    else Object.assign(payload, { consignaPrice: +f.price || null })
    await submitLead(mode, payload)
    setBusy(false)
    const msg = loan
      ? `Hola, necesito un préstamo vehicular:\n• Auto en garantía: ${f.vehicle}\n• Monto: S/ ${(+f.amount).toLocaleString('es-PE')}\n• Plazo: ${f.term} meses`
      : `Hola, quiero consignar mi vehículo:\n• ${f.vehicle}\n• Precio deseado: ${f.price ? usd(f.price) : 'por definir'}`
    window.open(wa(cfg.whatsapp, `Soy ${f.name.trim()}. ${msg}`), '_blank')
    onClose()
  }
  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal stack" onClick={(e) => e.stopPropagation()} onSubmit={send}>
        <button type="button" className="modal-x" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <h2>{loan ? 'Préstamo con tu auto en garantía' : 'Vende en consignación'}</h2>
        <p className="muted">
          {loan
            ? `Desde ${cfg.baseTEA}% TEA, de 6 a 60 meses. Tu auto queda en custodia mientras pagas.`
            : `Lo vendemos al mejor precio del mercado. Solo cobramos ${cfg.commission}% cuando se vende.`}
        </p>
        <div className="grid2">
          <div className="field">
            <label htmlFor="s-name">Tu nombre</label>
            <input id="s-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="s-phone">Celular</label>
            <input id="s-phone" className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="s-veh">Tu auto</label>
          <input id="s-veh" className="input" placeholder="Toyota RAV4 2020" value={f.vehicle} onChange={(e) => setF({ ...f, vehicle: e.target.value })} />
        </div>
        {loan ? (
          <>
            <div className="grid2">
              <div className="field">
                <label htmlFor="s-amt">Monto (S/)</label>
                <input id="s-amt" className="input" type="number" min="3000" step="500" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="s-term">Plazo</label>
                <select id="s-term" className="select" value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })}>
                  {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} meses
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p>
              Cuota referencial: <strong>S/ {Math.round(cuota(+f.amount || 0, cfg.baseTEA, +f.term)).toLocaleString('es-PE')}</strong> al mes
            </p>
          </>
        ) : (
          <div className="field">
            <label htmlFor="s-price">¿En cuánto quieres venderlo? (US$, opcional)</label>
            <input id="s-price" className="input" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          </div>
        )}
        {err && <p className="err">{err}</p>}
        <button className="btn btn-wa" disabled={busy}>
          {busy ? 'Enviando…' : 'Enviar por WhatsApp'}
        </button>
      </form>
    </div>
  )
}

function CarCard({ car, onOpen }) {
  return (
    <button className="car" onClick={() => onOpen(car)}>
      {car.images[0] ? <img className="car-img" src={car.images[0]} alt="" loading="lazy" /> : <div className="car-img" />}
      <div className="car-body">
        <span className="car-title">
          {car.brand} {car.model}
        </span>
        <div className="chips">
          <span className="chip">{car.year}</span>
          {car.km != null && <span className="chip">{(+car.km).toLocaleString('es-PE')} km</span>}
          {car.trans && <span className="chip">{car.trans}</span>}
          {car.status === 'reservado' && <span className="chip">Reservado</span>}
        </div>
        <span className="car-price">{usd(car.price)}</span>
      </div>
    </button>
  )
}

function CarModal({ car, cfg, onClose }) {
  const [i, setI] = useState(0)
  const [f, setF] = useState({ name: '', phone: '' })
  const [err, setErr] = useState('')
  const title = `${car.brand} ${car.model} ${car.year}`
  const ask = async (e) => {
    e.preventDefault()
    const phone = f.phone.replace(/\D/g, '')
    if (f.name.trim().length < 2 || phone.length !== 9) return setErr('Escribe tu nombre y un celular de 9 dígitos.')
    await submitLead('seminuevo', { name: f.name.trim(), phone: '+51' + phone, vehicleId: car.id, vehicle: title, price: car.price })
    window.open(wa(cfg.whatsapp, `Hola, soy ${f.name.trim()}. Me interesa el ${title} publicado en ${usd(car.price)}. ¿Sigue disponible?`), '_blank')
    onClose()
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        {car.images.length > 0 && <img src={car.images[i]} alt={title} style={{ borderRadius: 6, aspectRatio: '16/10', objectFit: 'cover', width: '100%' }} />}
        {car.images.length > 1 && (
          <div className="row">
            {car.images.map((src, k) => (
              <button key={k} onClick={() => setI(k)} style={{ border: k === i ? '2px solid var(--ink)' : '2px solid transparent', padding: 0, background: 'none', cursor: 'pointer' }}>
                <img src={src} alt={`Foto ${k + 1}`} style={{ width: 64, height: 48, objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
        <h2>{title}</h2>
        <div className="car-price">{usd(car.price)}</div>
        <div className="chips">
          {car.km != null && <span className="chip">{(+car.km).toLocaleString('es-PE')} km</span>}
          {car.trans && <span className="chip">{car.trans}</span>}
          {car.fuel && <span className="chip">{car.fuel}</span>}
          {car.color && <span className="chip">{car.color}</span>}
        </div>
        <form className="stack" onSubmit={ask}>
          <div className="grid2">
            <input className="input" aria-label="Tu nombre" placeholder="Tu nombre" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" aria-label="Celular" placeholder="Celular" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          {err && <p className="err">{err}</p>}
          <button className="btn btn-wa">Preguntar por este auto</button>
        </form>
      </div>
    </div>
  )
}

function useInventory() {
  const [cars, setCars] = useState(null)
  useEffect(() => {
    loadPublicInventory().then(setCars)
  }, [])
  return cars
}

export function Home({ cfg }) {
  const [svc, setSvc] = useState(null)
  const [car, setCar] = useState(null)
  const cars = useInventory()
  return (
    <Layout cfg={cfg}>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Tu auto, vendido hoy y pagado al contado.</h1>
            <p className="lead">
              Compramos autos usados en Lima. Te damos una pre-oferta en segundos, la oferta final por WhatsApp en menos de 2 horas y el pago el mismo día de la inspección.
            </p>
            <div className="row">
              <a href="#tasar" className="btn btn-signal">
                Tasar mi auto gratis
              </a>
              <a href="#como" className="btn btn-ghost" style={{ color: '#fff', borderColor: '#fff' }}>
                Cómo funciona
              </a>
            </div>
            <div className="hero-facts">
              <span>
                <strong>2 h</strong>oferta final
              </span>
              <span>
                <strong>24–48 h</strong>pago completo
              </span>
              <span>
                <strong>38</strong>marcas que compramos
              </span>
            </div>
          </div>
          {cfg.modules.compramos && <Tasador cfg={cfg} />}
        </div>
      </section>

      <section className="sec" id="como">
        <div className="wrap">
          <div className="sec-head">
            <h2>Así vendes tu auto</h2>
          </div>
          <div className="steps">
            {[
              ['Tasa en línea', 'Marca, modelo, año y kilometraje. Ves tu pre-oferta al instante, comparada con avisos reales de Lima.'],
              ['Recibe la oferta', 'Te escribimos por WhatsApp con una oferta final en menos de 2 horas. Sin compromiso.'],
              ['Cobra el mismo día', 'Inspeccionamos en tu casa o en nuestra oficina, firmamos la transferencia y te pagamos. Si tiene deuda, la cancelamos nosotros.'],
            ].map(([t, d], k) => (
              <div className="step" key={t}>
                <div className="step-n">{k + 1}</div>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec band" id="servicios">
        <div className="wrap">
          <div className="sec-head">
            <h2>Tres formas de sacarle dinero a tu auto</h2>
          </div>
          <div className="services" style={{ color: 'var(--ink)' }}>
            {cfg.modules.compramos && (
              <div className="svc main">
                <span className="big">Compra inmediata</span>
                <p>Te compramos el auto al contado. La opción más rápida si necesitas el dinero ya.</p>
                <a className="btn" href="#tasar">
                  Tasar mi auto
                </a>
              </div>
            )}
            {cfg.modules.consigna && (
              <div className="svc">
                <span className="big">Consignación</span>
                <p>Lo vendemos por ti al mejor precio. Cobramos {cfg.commission}% solo cuando se vende.</p>
                <button className="btn btn-ghost" onClick={() => setSvc('consigna')}>
                  Consignar mi auto
                </button>
              </div>
            )}
            {cfg.modules.prestamos && (
              <div className="svc">
                <span className="big">Préstamo</span>
                <p>Usa tu auto como garantía. Desde {cfg.baseTEA}% TEA y de 6 a 60 meses.</p>
                <button className="btn btn-ghost" onClick={() => setSvc('prestamos')}>
                  Simular préstamo
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {cfg.modules.seminuevos && cars && cars.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec-head row" style={{ justifyContent: 'space-between' }}>
              <h2>Seminuevos disponibles</h2>
              <Link to="/seminuevos" className="btn btn-ghost btn-sm">
                Ver todos ({cars.length})
              </Link>
            </div>
            <div className="cars">
              {cars.slice(0, 6).map((c) => (
                <CarCard key={c.id} car={c} onOpen={setCar} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="sec" style={{ background: '#fff' }}>
        <div className="wrap faq">
          <div className="sec-head">
            <h2>Preguntas frecuentes</h2>
          </div>
          {FAQ.slice(0, 5).map((q) => (
            <details key={q.q}>
              <summary>{q.q}</summary>
              <p>{q.a}</p>
            </details>
          ))}
          <p style={{ marginTop: 20 }}>
            <Link to="/faq">Ver todas las preguntas</Link>
          </p>
        </div>
      </section>

      {svc && <ServiceModal cfg={cfg} mode={svc} onClose={() => setSvc(null)} />}
      {car && <CarModal car={car} cfg={cfg} onClose={() => setCar(null)} />}
    </Layout>
  )
}

export function Seminuevos({ cfg }) {
  const cars = useInventory()
  const [car, setCar] = useState(null)
  const [q, setQ] = useState({ brand: '', max: '', sort: 'orden' })
  const brands = useMemo(() => [...new Set((cars || []).map((c) => c.brand))].sort(), [cars])
  const list = useMemo(() => {
    let l = (cars || []).filter((c) => (!q.brand || c.brand === q.brand) && (!q.max || c.price <= +q.max))
    if (q.sort === 'precio') l = [...l].sort((a, b) => a.price - b.price)
    if (q.sort === 'precio-desc') l = [...l].sort((a, b) => b.price - a.price)
    if (q.sort === 'anio') l = [...l].sort((a, b) => b.year - a.year)
    if (q.sort === 'km') l = [...l].sort((a, b) => (a.km || 0) - (b.km || 0))
    return l
  }, [cars, q])
  return (
    <Layout cfg={cfg}>
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <h1 style={{ fontSize: 'clamp(40px,6vw,72px)' }}>Seminuevos</h1>
            <p className="lead measure">Autos revisados, con papeles en regla y listos para transferir.</p>
          </div>
          <div className="filters">
            <select className="select" aria-label="Marca" value={q.brand} onChange={(e) => setQ({ ...q, brand: e.target.value })}>
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <input className="input" aria-label="Precio máximo" type="number" placeholder="Precio máximo US$" value={q.max} onChange={(e) => setQ({ ...q, max: e.target.value })} />
            <select className="select" aria-label="Ordenar" value={q.sort} onChange={(e) => setQ({ ...q, sort: e.target.value })}>
              <option value="orden">Destacados</option>
              <option value="precio">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
              <option value="anio">Más nuevos</option>
              <option value="km">Menos kilómetros</option>
            </select>
          </div>
          {cars === null ? (
            <p className="muted">Cargando autos…</p>
          ) : list.length === 0 ? (
            <div className="panel">
              <p>No hay autos con esos filtros. ¿Buscas algo en particular?</p>
              <a className="btn btn-wa" style={{ marginTop: 12 }} href={wa(cfg.whatsapp, 'Hola, estoy buscando un auto seminuevo')} target="_blank" rel="noreferrer">
                Cuéntanos qué buscas
              </a>
            </div>
          ) : (
            <div className="cars">
              {list.map((c) => (
                <CarCard key={c.id} car={c} onOpen={setCar} />
              ))}
            </div>
          )}
        </div>
      </section>
      {car && <CarModal car={car} cfg={cfg} onClose={() => setCar(null)} />}
    </Layout>
  )
}

export function Faq({ cfg }) {
  return (
    <Layout cfg={cfg}>
      <section className="sec">
        <div className="wrap faq">
          <div className="sec-head">
            <h1 style={{ fontSize: 'clamp(40px,6vw,72px)' }}>Preguntas frecuentes</h1>
          </div>
          {FAQ.map((q) => (
            <details key={q.q}>
              <summary>{q.q}</summary>
              <p>{q.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Layout>
  )
}
