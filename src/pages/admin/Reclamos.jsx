import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/config'

// Suma días hábiles (lunes a viernes). No descuenta feriados: revisa el calendario oficial.
export function addBusinessDays(date, n) {
  const d = new Date(date)
  let added = 0
  while (added < n) {
    d.setDate(d.getDate() + 1)
    const w = d.getDay()
    if (w !== 0 && w !== 6) added++
  }
  return d
}
const daysLeft = (iso) => Math.ceil((addBusinessDays(iso, 15) - Date.now()) / 864e5)

function Detail({ r, onClose, onSaved }) {
  const [f, setF] = useState({ estado: r.estado, respuesta: r.respuesta || '', acciones: r.acciones || '' })
  const [busy, setBusy] = useState(false)
  const save = async (markAnswered) => {
    setBusy(true)
    const changes = { ...f, ...(markAnswered ? { estado: 'respondido', respondido_at: new Date().toISOString() } : {}) }
    await supabase.from('ap_reclamos').update(changes).eq('id', r.id)
    setBusy(false)
    onSaved({ ...r, ...changes })
  }
  const mail = `mailto:${r.email}?subject=${encodeURIComponent(`Respuesta a su ${r.tipo} N.° ${r.codigo} — AutoPago`)}&body=${encodeURIComponent(`Estimado(a) ${r.nombre}:\n\nEn atención a su ${r.tipo} N.° ${r.codigo}, registrado el ${new Date(r.created_at).toLocaleDateString('es-PE')}, le informamos lo siguiente:\n\n${f.respuesta}\n\nAtentamente,\nAutoPago`)}`
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <div>
          <span className="tag">{r.tipo === 'queja' ? 'Queja' : 'Reclamo'}</span> <span className="small muted">{r.codigo}</span>
          <h2 style={{ fontSize: 26, marginTop: 6 }}>{r.nombre}</h2>
          <p className="small muted">
            {r.doc_tipo} {r.doc_numero} · {r.email} · {r.telefono || 'sin teléfono'} · {r.domicilio}
            {r.menor_edad && ` · Menor, apoderado: ${r.apoderado}`}
          </p>
        </div>
        <div className="panel" style={{ background: '#f7f8f5' }}>
          <p className="small"><b>Bien:</b> {r.bien_tipo} — {r.bien_descripcion} {r.monto ? `· ${r.moneda === 'PEN' ? 'S/' : 'US$'} ${r.monto}` : ''}</p>
          <p className="small" style={{ marginTop: 8 }}><b>Detalle:</b> {r.detalle}</p>
          <p className="small" style={{ marginTop: 8 }}><b>Pedido:</b> {r.pedido}</p>
        </div>
        <div className="field">
          <label htmlFor="rc-resp">Respuesta al consumidor</label>
          <textarea id="rc-resp" className="input" rows={5} value={f.respuesta} onChange={(e) => setF({ ...f, respuesta: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="rc-acc">Acciones adoptadas (registro interno)</label>
          <textarea id="rc-acc" className="input" rows={2} value={f.acciones} onChange={(e) => setF({ ...f, acciones: e.target.value })} />
        </div>
        <div className="row">
          <button className="btn btn-ghost" disabled={busy} onClick={() => save(false)}>
            Guardar borrador
          </button>
          <a className="btn" href={mail} onClick={() => f.respuesta && save(true)}>
            Responder por correo y marcar respondido
          </a>
        </div>
        {r.respondido_at && <p className="small okmsg">Respondido el {new Date(r.respondido_at).toLocaleString('es-PE')}</p>}
      </div>
    </div>
  )
}

export default function Reclamos() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const load = useCallback(() => supabase.from('ap_reclamos').select('*').order('created_at', { ascending: false }).then(({ data }) => setRows(data || [])), [])
  useEffect(() => {
    load()
  }, [load])
  return (
    <>
      <h1>Libro de Reclamaciones</h1>
      <p className="small muted" style={{ marginBottom: 14 }}>
        Plazo legal de respuesta: 15 días hábiles improrrogables. El contador no descuenta feriados.
      </p>
      <div className="panel" style={{ overflowX: 'auto' }}>
        {rows === null ? (
          <p className="muted small">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="muted small">No hay reclamos ni quejas registrados.</p>
        ) : (
          <table className="t">
            <thead>
              <tr>
                <th>Código</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Consumidor</th>
                <th>Estado</th>
                <th className="num">Plazo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const left = daysLeft(r.created_at)
                return (
                  <tr key={r.id} onClick={() => setOpen(r)} style={{ cursor: 'pointer' }}>
                    <td>{r.codigo}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('es-PE')}</td>
                    <td>{r.tipo}</td>
                    <td>
                      {r.nombre}
                      <div className="small muted">{r.email}</div>
                    </td>
                    <td>{r.estado}</td>
                    <td className="num">
                      {r.estado === 'respondido' ? '—' : <span className={left <= 3 ? 'err' : ''}>{left > 0 ? `${left} d` : 'Vencido'}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Detail
          r={open}
          onClose={() => setOpen(null)}
          onSaved={(nr) => {
            setRows(rows.map((x) => (x.id === nr.id ? nr : x)))
            setOpen(null)
          }}
        />
      )}
    </>
  )
}
