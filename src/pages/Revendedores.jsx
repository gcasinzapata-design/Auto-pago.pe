import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, usd, wa } from '../lib/config'
import { useProfile, signOut, authError } from '../lib/auth'
import { mapCar } from '../lib/inventory'
import { Brand } from '../components/Shell'
import Consent from '../components/Consent'

export function AuthBox({ title, sub, allowSignup, signupLabel = 'Soy revendedor y quiero una cuenta', signupTitle = 'Crear cuenta de revendedor' }) {
  const [mode, setMode] = useState('in')
  const [f, setF] = useState({ email: '', password: '', name: '', phone: '', company: '' })
  const [msg, setMsg] = useState({ err: '', ok: '' })
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const go = async (e) => {
    e.preventDefault()
    setMsg({ err: '', ok: '' })
    setBusy(true)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password })
      if (error) setMsg({ err: authError(error), ok: '' })
    } else {
      const phone = f.phone.replace(/\D/g, '')
      if (!f.name.trim() || phone.length !== 9) {
        setBusy(false)
        return setMsg({ err: 'Completa tu nombre y un celular de 9 dígitos.', ok: '' })
      }
      if (!ok) {
        setBusy(false)
        return setMsg({ err: 'Marca la casilla para aceptar los términos y la política de privacidad.', ok: '' })
      }
      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim(),
        password: f.password,
        options: {
          data: { name: f.name.trim(), phone: '+51' + phone, company: f.company.trim(), role: 'reseller' },
          emailRedirectTo: window.location.origin + '/revendedores',
        },
      })
      if (error) setMsg({ err: authError(error), ok: '' })
      else if (!data.session) setMsg({ err: '', ok: 'Te enviamos un correo para confirmar tu cuenta. Después, entra con tu contraseña.' })
    }
    setBusy(false)
  }
  return (
    <div className="auth">
      <form className="panel stack" onSubmit={go}>
        <Brand />
        <div>
          <h2 style={{ fontSize: 34 }}>{mode === 'in' ? title : signupTitle}</h2>
          <p className="muted small">{sub}</p>
        </div>
        {mode === 'up' && (
          <>
            <div className="field">
              <label htmlFor="a-name">Nombre completo</label>
              <input id="a-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="a-phone">Celular</label>
                <input id="a-phone" className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="a-co">Empresa o patio (opcional)</label>
                <input id="a-co" className="input" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
              </div>
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="a-email">Correo</label>
          <input id="a-email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="a-pass">Contraseña</label>
          <input id="a-pass" className="input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        {mode === 'up' && <Consent id="consent-up" checked={ok} onChange={setOk} />}
        {msg.err && <p className="err">{msg.err}</p>}
        {msg.ok && <p className="okmsg">{msg.ok}</p>}
        <button className="btn btn-signal" disabled={busy}>
          {busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}
        </button>
        {allowSignup && (
          <button type="button" className="btn btn-ghost" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
            {mode === 'in' ? signupLabel : 'Ya tengo cuenta'}
          </button>
        )}
        <Link to="/" className="small muted">
          Volver a autopago.pe
        </Link>
      </form>
    </div>
  )
}

function timeLeft(iso) {
  if (!iso) return null
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return 'Cerrada'
  const h = Math.floor(ms / 36e5)
  const m = Math.floor((ms % 36e5) / 6e4)
  return h >= 24 ? `Cierra en ${Math.floor(h / 24)} d ${h % 24} h` : `Cierra en ${h} h ${m} min`
}

function Portal({ profile }) {
  const [cars, setCars] = useState(null)
  const [summary, setSummary] = useState({})
  const [mine, setMine] = useState([])
  const [bid, setBid] = useState({})
  const [msg, setMsg] = useState({})
  const load = useCallback(async () => {
    const [{ data: inv }, { data: my }] = await Promise.all([
      supabase.rpc('ap_wholesale_list'),
      supabase.from('ap_bids').select('*').eq('reseller_id', profile.user_id).order('created_at', { ascending: false }),
    ])
    setCars((inv || []).map(mapCar))
    setSummary(Object.fromEntries((inv || []).map((r) => [r.id, { max_amount: r.max_bid, bid_count: Number(r.bid_count) }])))
    setMine(my || [])
  }, [profile.user_id])
  useEffect(() => {
    load()
  }, [load])

  const place = async (car) => {
    const s = summary[car.id]
    const min = Math.max(car.minBid || 0, s?.max_amount ? +s.max_amount + 100 : 0)
    const amount = +bid[car.id]
    if (!amount || amount < min) return setMsg({ ...msg, [car.id]: { err: `La oferta mínima es ${usd(min)}.` } })
    if (car.auctionEndsAt && new Date(car.auctionEndsAt) < new Date()) return setMsg({ ...msg, [car.id]: { err: 'La subasta de este auto ya cerró.' } })
    const { error } = await supabase.from('ap_bids').insert({ inventory_id: car.id, reseller_id: profile.user_id, amount_usd: amount })
    if (error) return setMsg({ ...msg, [car.id]: { err: error.message?.length < 90 ? error.message + '.' : 'No se pudo registrar la oferta. Revisa el monto.' } })
    setMsg({ ...msg, [car.id]: { ok: `Oferta de ${usd(amount)} registrada.` } })
    setBid({ ...bid, [car.id]: '' })
    load()
  }

  const myBest = (id) => Math.max(0, ...mine.filter((b) => b.inventory_id === id).map((b) => +b.amount_usd))

  return (
    <div className="app">
      <aside className="side">
        <Brand to="/revendedores" />
        <button className="on">
          Autos mayoristas <span className="count">{cars?.length ?? ''}</span>
        </button>
        <button onClick={signOut}>Salir</button>
      </aside>
      <div className="main">
        <h1>Autos mayoristas</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Hola {profile.name?.split(' ')[0] || ''}. Precios para revendedores. Puedes comprar al precio fijo o dejar tu oferta.
        </p>
        {cars === null ? (
          <p className="muted">Cargando…</p>
        ) : cars.length === 0 ? (
          <div className="panel">No hay autos mayoristas publicados ahora. Te avisamos por WhatsApp cuando entren nuevos.</div>
        ) : (
          <div className="cars">
            {cars.map((car) => {
              const s = summary[car.id]
              const mineTop = myBest(car.id)
              const leading = mineTop && s && mineTop >= +s.max_amount
              const tl = timeLeft(car.auctionEndsAt)
              return (
                <div className="car" key={car.id} style={{ cursor: 'default' }}>
                  {car.images[0] ? <img className="car-img" src={car.images[0]} alt="" loading="lazy" /> : <div className="car-img" />}
                  <div className="car-body stack" style={{ gap: 8 }}>
                    <span className="car-title">
                      {car.brand} {car.model} {car.year}
                    </span>
                    <div className="chips">
                      {car.km != null && <span className="chip">{(+car.km).toLocaleString('es-PE')} km</span>}
                      {car.trans && <span className="chip">{car.trans}</span>}
                      {car.status === 'reservado' && <span className="chip">Reservado</span>}
                      {tl && <span className="chip">{tl}</span>}
                    </div>
                    {car.wholesalePrice && (
                      <div>
                        <span className="small muted">Precio mayorista</span>
                        <div className="car-price">{usd(car.wholesalePrice)}</div>
                      </div>
                    )}
                    <div className="small">
                      {s?.bid_count ? `${s.bid_count} ofertas · mejor ${usd(s.max_amount)}` : 'Sin ofertas todavía'}
                      {mineTop > 0 && (
                        <div className={leading ? 'okmsg' : 'err'}>
                          Tu mejor oferta: {usd(mineTop)} {leading ? '(vas primero)' : '(te superaron)'}
                        </div>
                      )}
                    </div>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <input
                        className="input"
                        type="number"
                        aria-label="Monto de tu oferta en dólares"
                        placeholder={`Mín. ${Math.max(car.minBid || 0, s?.max_amount ? +s.max_amount + 100 : 0) || '—'}`}
                        value={bid[car.id] || ''}
                        onChange={(e) => setBid({ ...bid, [car.id]: e.target.value })}
                      />
                      <button className="btn btn-sm" onClick={() => place(car)}>
                        Ofertar
                      </button>
                    </div>
                    {msg[car.id]?.err && <p className="err">{msg[car.id].err}</p>}
                    {msg[car.id]?.ok && <p className="okmsg">{msg[car.id].ok}</p>}
                    {car.wholesalePrice && (
                      <a
                        className="btn btn-wa btn-sm"
                        target="_blank"
                        rel="noreferrer"
                        href={wa('51970625242', `Hola, soy ${profile.name} (revendedor). Quiero comprar el ${car.brand} ${car.model} ${car.year} a ${usd(car.wholesalePrice)}.`)}
                      >
                        Comprar a precio fijo
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Revendedores() {
  const { loading, session, profile } = useProfile()
  if (loading) return <div className="auth" />
  if (!session) return <AuthBox title="Portal de revendedores" sub="Autos a precio mayorista antes de que salgan al público." allowSignup />
  if (!profile || (!profile.approved && profile.role !== 'admin'))
    return (
      <div className="auth">
        <div className="panel stack">
          <Brand />
          <h2 style={{ fontSize: 32 }}>Tu cuenta está en revisión</h2>
          <p>Validamos a cada revendedor antes de mostrarle precios mayoristas. Te escribimos por WhatsApp apenas se apruebe, normalmente el mismo día.</p>
          <a className="btn btn-wa" href={wa('51970625242', 'Hola, me registré como revendedor en AutoPago y quiero activar mi cuenta.')} target="_blank" rel="noreferrer">
            Acelerar por WhatsApp
          </a>
          <button className="btn btn-ghost" onClick={signOut}>
            Salir
          </button>
        </div>
      </div>
    )
  return <Portal profile={profile} />
}
