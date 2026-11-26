import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../components/Shell'
import Tasador from '../components/Tasador'
import { usd, wa, submitLead } from '../lib/config'
import { loadPublicInventory } from '../lib/inventory'
import { FAQ } from '../lib/faq'
import { Check, Shield, Clock, Bank, Doc, Home as HomeIco, Car, Tag, Coins, WhatsApp } from '../components/Icons'

function Layout({ cfg, children }) {
  // Oculta la barra fija mientras el tasador está en pantalla
  const [hide, setHide] = useState(false)
  useEffect(() => {
    const el = document.getElementById('tasar')
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setHide(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <Nav cfg={cfg} />
      <main>{children}</main>
      <Footer cfg={cfg} />
      <div className={'sticky-cta' + (hide ? ' hide' : '')}>
        <a className="btn btn-signal" href="/#tasar">
          Calcular pre-oferta
        </a>
        <a className="btn btn-wa" aria-label="WhatsApp" href={wa(cfg.whatsapp, 'Hola AutoPago')} target="_blank" rel="noreferrer" style={{ flex: '0 0 auto' }}>
          <WhatsApp />
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
            <span className="pill">
              <span className="dot" /> Compramos tu auto en Lima
            </span>
            <h1>Vende tu auto hoy, con pago seguro el mismo día.</h1>
            <p className="lead">Calcula tu pre-oferta en segundos. Te enviamos la oferta final por WhatsApp en menos de 2 horas y pagamos por transferencia al firmar ante notario.</p>
            <ul className="checks">
              <li>
                <Check /> Inspección gratis en tu casa
              </li>
              <li>
                <Check /> Pago por transferencia bancaria
              </li>
              <li>
                <Check /> Compramos autos con deuda
              </li>
              <li>
                <Check /> Nos encargamos de todo el trámite
              </li>
            </ul>
            <figure className="hero-photo">
              <img src="/img/trust.jpg" alt="Entrega de llaves al cerrar la venta de un auto" />
              <figcaption>
                <Shield width="18" height="18" style={{ color: 'var(--brand)' }} /> Transferencia ante notario e inscrita en SUNARP
              </figcaption>
            </figure>
          </div>
          {cfg.modules.compramos && <Tasador cfg={cfg} />}
        </div>
      </section>

      <div className="trustbar">
        <div className="wrap trustbar-in">
          {[
            [Clock, 'Oferta en 2 horas', 'Por WhatsApp, sin compromiso'],
            [Bank, 'Pago el mismo día', 'Transferencia a tu cuenta'],
            [Doc, 'Trámite legal', 'Notaría y SUNARP'],
            [HomeIco, 'Vamos a ti', 'Toda Lima Metropolitana'],
          ].map(([I, t, d]) => (
            <div className="trust-item" key={t}>
              <span className="trust-ico">
                <I />
              </span>
              <div>
                <b>{t}</b>
                <span>{d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="sec alt" id="metodo">
        <div className="wrap">
          <div className="sec-head">
            <h2>Cómo calculamos tu oferta</h2>
            <p className="lead">Sin adivinanzas: la pre-oferta sale de datos, y la oferta final de ver tu auto.</p>
          </div>
          <div className="method">
            <div className="method-item">
              <b className="big">+2,600</b>
              <h3>Precios reales de Lima</h3>
              <p>Comparamos tu auto con avisos actuales del mismo modelo y año.</p>
            </div>
            <div className="method-item">
              <b className="big">km</b>
              <h3>Ajuste por uso</h3>
              <p>Corregimos por kilometraje frente a lo normal para su año y por su estado.</p>
            </div>
            <div className="method-item">
              <b className="big">0</b>
              <h3>Costos para ti</h3>
              <p>El pago inmediato ya incluye trámite notarial, SUNARP, revisión y el riesgo de reventa.</p>
            </div>
            <div className="method-item">
              <b className="big">2 h</b>
              <h3>Oferta final</h3>
              <p>Un asesor confirma el monto tras la revisión física gratuita en tu casa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" id="como">
        <div className="wrap split">
          <div>
            <div className="sec-head" style={{ marginBottom: 20 }}>
              <h2>Vender tu auto, sin vueltas</h2>
              <p className="lead">Tres pasos y el dinero en tu cuenta. Tú no tienes que publicar, negociar ni recibir desconocidos.</p>
            </div>
            <ol className="steps">
              {[
                ['Calcula tu pre-oferta', 'Marca, modelo, año y kilometraje. La comparamos con autos similares que se venden hoy en Lima.'],
                ['Recibe la oferta final', 'Un asesor te escribe por WhatsApp en menos de 2 horas. Si no te convence, no pasa nada.'],
                ['Firma y cobra', 'Revisamos el auto en tu casa, firmamos ante notario y te transferimos el mismo día. Si tiene deuda, la pagamos al banco por ti.'],
              ].map(([t, d], k) => (
                <li className="step" key={t}>
                  <span className="step-n">{k + 1}</span>
                  <div>
                    <h3>{t}</h3>
                    <p className="muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a href="#tasar" className="btn btn-signal" style={{ marginTop: 20 }}>
              Calcular mi pre-oferta
            </a>
          </div>
          <div className="split-photo">
            <img src="/img/process.jpg" alt="Cliente recibiendo su oferta por WhatsApp" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="sec alt" id="servicios">
        <div className="wrap">
          <div className="sec-head">
            <h2>Elige cómo sacarle dinero a tu auto</h2>
            <p className="lead">Según cuánto apuro tengas y si quieres seguir usándolo.</p>
          </div>
          <div className="services">
            {cfg.modules.compramos && (
              <div className="svc main">
                <span className="svc-ico">
                  <Coins />
                </span>
                <span className="meta">Lo más rápido</span>
                <span className="big">Compra inmediata</span>
                <p>Te compramos el auto al contado. Ideal si necesitas el dinero esta semana.</p>
                <a className="btn btn-signal" href="#tasar">
                  Calcular pre-oferta
                </a>
              </div>
            )}
            {cfg.modules.consigna && (
              <div className="svc">
                <span className="svc-ico">
                  <Tag />
                </span>
                <span className="meta">Mejor precio</span>
                <span className="big">Consignación</span>
                <p>Lo vendemos por ti al precio de mercado. Solo cobramos {cfg.commission}% cuando se vende.</p>
                <button className="btn btn-ghost" onClick={() => setSvc('consigna')}>
                  Consignar mi auto
                </button>
              </div>
            )}
            {cfg.modules.prestamos && (
              <div className="svc">
                <span className="svc-ico">
                  <Car />
                </span>
                <span className="meta">Desde {cfg.baseTEA}% TEA</span>
                <span className="big">Préstamo con tu auto</span>
                <p>Recibe efectivo usando tu auto como garantía, de 6 a 60 meses.</p>
                <button className="btn btn-ghost" onClick={() => setSvc('prestamos')}>
                  Simular mi cuota
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {cfg.modules.seminuevos && cars && cars.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 32 }}>
              <h2>Seminuevos disponibles</h2>
              <Link to="/seminuevos" className="btn btn-ghost btn-sm">
                Ver los {cars.length}
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

      <section className="sec">
        <div className="wrap faq-grid faq">
          <div>
            <h2>Preguntas frecuentes</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              ¿Otra duda? Escríbenos y te responde una persona, no un bot.
            </p>
            <a className="btn btn-wa" style={{ marginTop: 20 }} href={wa(cfg.whatsapp, 'Hola AutoPago, tengo una consulta')} target="_blank" rel="noreferrer">
              <WhatsApp /> Hablar con un asesor
            </a>
          </div>
          <div>
            {FAQ.slice(0, 6).map((q) => (
              <details key={q.q}>
                <summary>{q.q}</summary>
                <p>{q.a}</p>
              </details>
            ))}
            <p style={{ marginTop: 20 }}>
              <Link to="/faq" style={{ fontWeight: 600, color: 'var(--brand)' }}>
                Ver todas las preguntas
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 96px' }}>
        <div className="wrap">
          <div className="cta-band">
            <div>
              <h2 style={{ color: '#fff' }}>¿Cuánto vale tu auto hoy?</h2>
              <p>Pre-oferta gratis en 30 segundos, sin registrarte.</p>
            </div>
            <a href="#tasar" className="btn btn-signal">
              Calcular ahora
            </a>
          </div>
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
            <h1>Seminuevos</h1>
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
            <h1>Preguntas frecuentes</h1>
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
