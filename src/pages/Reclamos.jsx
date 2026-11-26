import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../components/Shell'
import { supabase } from '../lib/config'
import { LEGAL, titular } from '../lib/legal'
import { Book } from '../components/Icons'

const EMPTY = {
  nombre: '',
  doc_tipo: 'DNI',
  doc_numero: '',
  domicilio: '',
  telefono: '',
  email: '',
  menor_edad: false,
  apoderado: '',
  bien_tipo: 'servicio',
  bien_descripcion: '',
  monto: '',
  moneda: 'USD',
  tipo: 'reclamo',
  detalle: '',
  pedido: '',
}

const fmt = (iso) =>
  new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })

function Constancia({ data, codigo, createdAt, onNew }) {
  const row = (k, v) => (
    <div className="lr-row">
      <dt>{k}</dt>
      <dd>{v || '—'}</dd>
    </div>
  )
  return (
    <div className="lr-sheet lr-print">
      <div className="lr-sheet-head">
        <div>
          <span className="doc-k">Constancia de registro</span>
          <h2>Hoja de reclamación N.° {codigo}</h2>
          <p className="small muted">Registrada el {fmt(createdAt)}</p>
        </div>
        <span className="lr-badge">{data.tipo === 'queja' ? 'Queja' : 'Reclamo'}</span>
      </div>
      <dl className="lr-dl">
        {row('Proveedor', `${titular()} · ${LEGAL.domicilio}`)}
        {row('Consumidor', data.nombre)}
        {row('Documento', `${data.doc_tipo} ${data.doc_numero}`)}
        {row('Domicilio', data.domicilio)}
        {row('Teléfono', data.telefono)}
        {row('Correo', data.email)}
        {data.menor_edad && row('Padre, madre o apoderado', data.apoderado)}
        {row('Bien contratado', `${data.bien_tipo === 'producto' ? 'Producto' : 'Servicio'}: ${data.bien_descripcion}`)}
        {row('Monto reclamado', data.monto ? `${data.moneda === 'PEN' ? 'S/' : 'US$'} ${Number(data.monto).toLocaleString('es-PE')}` : '')}
        {row('Detalle', data.detalle)}
        {row('Pedido del consumidor', data.pedido)}
      </dl>
      <div className="lr-legal">
        <p>AutoPago dará respuesta a este {data.tipo} en un plazo no mayor a quince (15) días hábiles improrrogables, al correo {data.email}.</p>
        <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
      </div>
      <div className="row no-print">
        <button className="btn btn-signal" onClick={() => window.print()}>
          Descargar o imprimir constancia
        </button>
        <button className="btn btn-ghost" onClick={onNew}>
          Registrar otro
        </button>
      </div>
      <p className="small muted no-print">Guarda el número {codigo}. También te enviamos una copia por correo.</p>
    </div>
  )
}

export default function Reclamos({ cfg }) {
  const [f, setF] = useState(EMPTY)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => {
    document.title = 'Libro de Reclamaciones | AutoPago'
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const email = f.email.trim()
    if (f.nombre.trim().length < 2) return setErr('Escribe tu nombre completo.')
    if (f.doc_numero.replace(/\s/g, '').length < 6) return setErr('Escribe tu número de documento.')
    if (f.domicilio.trim().length < 3) return setErr('Escribe tu domicilio.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr('Escribe un correo válido: ahí te enviaremos la constancia y la respuesta.')
    if (f.menor_edad && f.apoderado.trim().length < 2) return setErr('Si eres menor de edad, indica el nombre de tu padre, madre o apoderado.')
    if (f.bien_descripcion.trim().length < 3) return setErr('Describe el producto o servicio.')
    if (f.detalle.trim().length < 10) return setErr('Cuéntanos el detalle de tu reclamo o queja (mínimo 10 caracteres).')
    if (f.pedido.trim().length < 3) return setErr('Indica qué solicitas.')
    setBusy(true)
    const payload = { ...f, email, nombre: f.nombre.trim(), doc_numero: f.doc_numero.trim(), monto: f.monto ? String(+f.monto) : '' }
    const { data, error } = await supabase.rpc('ap_submit_reclamo', { r: payload })
    setBusy(false)
    if (error || !data?.[0]) return setErr('No se pudo registrar. Revisa los datos o escríbenos a ' + LEGAL.emailLegal + '.')
    const { codigo, created_at } = data[0]
    // Aviso y copia por correo (Make)
    try {
      fetch(LEGAL.reclamosHook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, created_at, fecha: fmt(created_at), proveedor: titular(), proveedorEmail: LEGAL.emailLegal, ...payload }),
      })
    } catch {
      /* noop */
    }
    setDone({ data: payload, codigo, createdAt: created_at })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Nav cfg={cfg} />
      <main className="legal">
        <header className="legal-hero">
          <div className="wrap">
            <span className="pill">
              <Book width="14" height="14" /> Conforme al Código de Protección y Defensa del Consumidor
            </span>
            <h1>Libro de Reclamaciones</h1>
            <p className="lead">
              {titular()} · {LEGAL.domicilio}
            </p>
          </div>
        </header>
        <div className="wrap lr-wrap">
          {done ? (
            <Constancia {...done} onNew={() => { setDone(null); setF(EMPTY) }} />
          ) : (
            <form className="lr-sheet" onSubmit={submit} noValidate>
              <div className="lr-sheet-head">
                <div>
                  <span className="doc-k">Hoja de reclamación virtual</span>
                  <h2>Registra tu reclamo o queja</h2>
                  <p className="small muted">Fecha: {fmt(new Date().toISOString())}. El número correlativo se asigna al enviar.</p>
                </div>
              </div>

              <fieldset className="lr-block">
                <legend>1. Identificación del consumidor</legend>
                <div className="grid2">
                  <div className="field">
                    <label htmlFor="r-nombre">Nombre completo</label>
                    <input id="r-nombre" className="input" autoComplete="name" value={f.nombre} onChange={set('nombre')} />
                  </div>
                  <div className="grid2 keep">
                    <div className="field">
                      <label htmlFor="r-doct">Documento</label>
                      <select id="r-doct" className="select" value={f.doc_tipo} onChange={set('doc_tipo')}>
                        <option>DNI</option>
                        <option>CE</option>
                        <option>Pasaporte</option>
                        <option>RUC</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="r-docn">Número</label>
                      <input id="r-docn" className="input" inputMode="numeric" value={f.doc_numero} onChange={set('doc_numero')} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="r-dom">Domicilio</label>
                    <input id="r-dom" className="input" autoComplete="street-address" value={f.domicilio} onChange={set('domicilio')} />
                  </div>
                  <div className="grid2 keep">
                    <div className="field">
                      <label htmlFor="r-tel">Teléfono</label>
                      <input id="r-tel" className="input" inputMode="tel" autoComplete="tel" value={f.telefono} onChange={set('telefono')} />
                    </div>
                    <div className="field">
                      <label htmlFor="r-mail">Correo electrónico</label>
                      <input id="r-mail" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
                    </div>
                  </div>
                </div>
                <label className="consent">
                  <input type="checkbox" checked={f.menor_edad} onChange={set('menor_edad')} />
                  <span>Soy menor de edad</span>
                </label>
                {f.menor_edad && (
                  <div className="field">
                    <label htmlFor="r-apod">Nombre del padre, madre o apoderado</label>
                    <input id="r-apod" className="input" value={f.apoderado} onChange={set('apoderado')} />
                  </div>
                )}
              </fieldset>

              <fieldset className="lr-block">
                <legend>2. Identificación del bien contratado</legend>
                <div className="seg" role="radiogroup" aria-label="Tipo de bien">
                  {[
                    ['servicio', 'Servicio'],
                    ['producto', 'Producto'],
                  ].map(([v, l]) => (
                    <button type="button" key={v} role="radio" aria-checked={f.bien_tipo === v} className={f.bien_tipo === v ? 'on' : ''} onClick={() => setF({ ...f, bien_tipo: v })}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="r-bien">Descripción</label>
                  <input id="r-bien" className="input" placeholder="Ej.: compra de mi Toyota RAV4 2020, folio AP-261126-XXXX" value={f.bien_descripcion} onChange={set('bien_descripcion')} />
                </div>
                <div className="grid2 keep" style={{ maxWidth: 360 }}>
                  <div className="field">
                    <label htmlFor="r-mon">Moneda</label>
                    <select id="r-mon" className="select" value={f.moneda} onChange={set('moneda')}>
                      <option value="USD">US$</option>
                      <option value="PEN">S/</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="r-monto">Monto reclamado</label>
                    <input id="r-monto" className="input" type="number" min="0" step="0.01" placeholder="Opcional" value={f.monto} onChange={set('monto')} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="lr-block">
                <legend>3. Detalle de la reclamación y pedido</legend>
                <div className="lr-types">
                  {[
                    ['reclamo', 'Reclamo', 'Disconformidad relacionada con los productos o servicios.'],
                    ['queja', 'Queja', 'Disconformidad no relacionada con los productos o servicios, o malestar por la atención al público.'],
                  ].map(([v, l, d]) => (
                    <button type="button" key={v} className={'cond' + (f.tipo === v ? ' on' : '')} aria-pressed={f.tipo === v} onClick={() => setF({ ...f, tipo: v })}>
                      <b>{l}</b>
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="r-det">Detalle</label>
                  <textarea id="r-det" className="input" rows={5} maxLength={3000} value={f.detalle} onChange={set('detalle')} />
                </div>
                <div className="field">
                  <label htmlFor="r-ped">Pedido</label>
                  <textarea id="r-ped" className="input" rows={3} maxLength={1500} placeholder="¿Qué solicitas a AutoPago?" value={f.pedido} onChange={set('pedido')} />
                </div>
              </fieldset>

              <div className="lr-legal">
                <p>AutoPago responderá en un plazo no mayor a quince (15) días hábiles improrrogables, al correo que indiques.</p>
                <p>La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>
                <p>
                  Tus datos se usarán solo para atender este registro, conforme a nuestra <Link to="/privacidad">Política de privacidad</Link>.
                </p>
              </div>
              {err && <p className="err">{err}</p>}
              <button className="btn btn-signal" disabled={busy}>
                {busy ? 'Registrando…' : 'Enviar hoja de reclamación'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer cfg={cfg} />
    </>
  )
}
