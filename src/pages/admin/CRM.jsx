import { useEffect, useMemo, useState } from 'react'
import { supabase, usd, wa } from '../../lib/config'
import { STAGES, TIERS, leadInfo, suggestTier, ago } from '../../lib/leads'
import { valuate, fetchMarket } from '../../lib/valuation'

function LeadDrawer({ lead, cfg, onClose, onSaved }) {
  const i = leadInfo(lead)
  const [f, setF] = useState({
    stage: lead.stage || 'nuevo',
    tier: lead.tier || suggestTier(lead),
    notes: lead.notes || '',
    next_action_at: lead.next_action_at ? lead.next_action_at.slice(0, 16) : '',
    offer_usd: lead.offer_usd || '',
    lost_reason: lead.lost_reason || '',
  })
  const [events, setEvents] = useState([])
  const [note, setNote] = useState('')
  const [val, setVal] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('ap_lead_events').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).then(({ data }) => setEvents(data || []))
    if (i.brand && i.model && i.year)
      fetchMarket(i.brand, i.model, i.year).then((m) => setVal(valuate({ brand: i.brand, model: i.model, year: i.year, km: i.km || 0, market: m, cfg })))
  }, [lead.id]) // eslint-disable-line

  const save = async () => {
    setBusy(true)
    const changes = { ...f, offer_usd: f.offer_usd ? +f.offer_usd : null, next_action_at: f.next_action_at ? new Date(f.next_action_at).toISOString() : null, updated_at: new Date().toISOString() }
    await supabase.from('ap_leads').update(changes).eq('id', lead.id)
    if (f.stage !== lead.stage) await supabase.from('ap_lead_events').insert({ lead_id: lead.id, kind: 'etapa', body: `${lead.stage || 'nuevo'} → ${f.stage}` })
    setBusy(false)
    onSaved({ ...lead, ...changes })
  }
  const addNote = async () => {
    if (!note.trim()) return
    const { data } = await supabase.from('ap_lead_events').insert({ lead_id: lead.id, kind: 'nota', body: note.trim() }).select().single()
    if (data) setEvents([data, ...events])
    setNote('')
  }
  const waMsg = f.offer_usd
    ? `Hola ${i.name.split(' ')[0]}, te escribe AutoPago. Revisamos tu ${i.vehicle} y te ofrecemos ${usd(f.offer_usd)} al contado, con pago el mismo día de la inspección. ¿Coordinamos?`
    : `Hola ${i.name.split(' ')[0]}, te escribe AutoPago por tu ${i.vehicle}. ¿Tienes un momento para conversar?`

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <div>
          <span className="tag">{i.group}</span> <span className="small muted">{ago(lead.created_at)}</span>
          <h2 style={{ fontSize: 32, marginTop: 6 }}>{i.name}</h2>
          <p>
            {i.vehicle}
            {i.km ? ` · ${i.km.toLocaleString('es-PE')} km` : ''}
            {i.amount ? ` · ${i.amount}` : ''}
          </p>
          <p className="small muted">
            {i.phone && `+${i.phone.startsWith('51') ? i.phone : '51' + i.phone}`} {i.email && ` · ${i.email}`}
            {i.p.plate && ` · Placa ${i.p.plate}`} {i.p.debt && ` · Deuda: ${i.p.debt}`}
          </p>
        </div>

        {val && (
          <div className="panel" style={{ background: '#f7f8f5' }}>
            <div className="grid3 small">
              <div>
                Valor comercial
                <div className="car-price">{usd(val.marketValue)}</div>
              </div>
              <div>
                Oferta máxima (−{val.discPct}%)
                <div className="car-price">{usd(val.offer)}</div>
              </div>
              <div>
                Margen
                <div className="car-price">{usd(val.margin)}</div>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 6 }}>
              {val.samples} avisos comparables · confianza {val.confidence} · castigo {val.origin} {val.penaltyPct}%{val.override ? ' · usa tu precio manual' : ''}
            </p>
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 8 }} onClick={() => setF({ ...f, offer_usd: Math.round(val.offer / 100) * 100 })}>
              Usar oferta sugerida
            </button>
          </div>
        )}

        <div className="grid3">
          <div className="field">
            <label htmlFor="d-stage">Etapa</label>
            <select id="d-stage" className="select" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="d-tier">Calificación</label>
            <select id="d-tier" className="select" value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })}>
              {TIERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="d-offer">Oferta (US$)</label>
            <input id="d-offer" className="input" type="number" value={f.offer_usd} onChange={(e) => setF({ ...f, offer_usd: e.target.value })} />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="d-next">Próximo seguimiento</label>
            <input id="d-next" className="input" type="datetime-local" value={f.next_action_at} onChange={(e) => setF({ ...f, next_action_at: e.target.value })} />
          </div>
          {f.stage === 'perdido' && (
            <div className="field">
              <label htmlFor="d-lost">Motivo</label>
              <select id="d-lost" className="select" value={f.lost_reason} onChange={(e) => setF({ ...f, lost_reason: e.target.value })}>
                <option value="">Elige un motivo</option>
                <option>Precio bajo para el cliente</option>
                <option>No responde</option>
                <option>Vendió a otro</option>
                <option>Auto fuera de perfil</option>
                <option>Solo cotizaba</option>
              </select>
            </div>
          )}
        </div>
        <div className="row">
          <button className="btn" disabled={busy} onClick={save}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {i.phone && (
            <a className="btn btn-wa" target="_blank" rel="noreferrer" href={wa(i.phone.length === 9 ? '51' + i.phone : i.phone, waMsg)}>
              Escribir por WhatsApp
            </a>
          )}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <h3>Historial</h3>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input className="input" aria-label="Nueva nota" placeholder="Agregar nota: llamé, pidió más, etc." value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNote()} />
            <button className="btn btn-sm btn-ghost" onClick={addNote}>
              Agregar
            </button>
          </div>
          {events.length === 0 && <p className="small muted">Sin movimientos todavía.</p>}
          {events.map((e) => (
            <p key={e.id} className="small">
              <span className="muted">{ago(e.created_at)} · </span>
              {e.kind === 'etapa' ? `Etapa: ${e.body}` : e.body}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CRM({ cfg, leads, setLeads }) {
  const [view, setView] = useState('tablero')
  const [q, setQ] = useState({ text: '', group: '', tier: '' })
  const [open, setOpen] = useState(null)
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)

  const list = useMemo(
    () =>
      leads
        .map((l) => ({ l, i: leadInfo(l), tier: l.tier || suggestTier(l) }))
        .filter(({ i, tier }) => (!q.group || i.group === q.group) && (!q.tier || tier === q.tier) && (!q.text || (i.name + i.vehicle + i.phone).toLowerCase().includes(q.text.toLowerCase()))),
    [leads, q],
  )
  const groups = [...new Set(leads.map((l) => leadInfo(l).group))]

  const move = async (id, stage) => {
    const l = leads.find((x) => x.id === id)
    if (!l || l.stage === stage) return
    setLeads(leads.map((x) => (x.id === id ? { ...x, stage } : x)))
    await supabase.from('ap_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('ap_lead_events').insert({ lead_id: id, kind: 'etapa', body: `${l.stage || 'nuevo'} → ${stage}` })
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Leads</h1>
        <div className="row">
          <button className={'btn btn-sm' + (view === 'tablero' ? '' : ' btn-ghost')} onClick={() => setView('tablero')}>
            Tablero
          </button>
          <button className={'btn btn-sm' + (view === 'tabla' ? '' : ' btn-ghost')} onClick={() => setView('tabla')}>
            Tabla
          </button>
        </div>
      </div>
      <div className="filters">
        <input className="input" aria-label="Buscar" placeholder="Buscar nombre, auto o celular" value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} />
        <select className="select" aria-label="Servicio" value={q.group} onChange={(e) => setQ({ ...q, group: e.target.value })}>
          <option value="">Todos los servicios</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select className="select" aria-label="Calificación" value={q.tier} onChange={(e) => setQ({ ...q, tier: e.target.value })}>
          <option value="">Todas las calificaciones</option>
          {TIERS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {view === 'tablero' ? (
        <div className="board">
          {STAGES.map((s) => {
            const col = list.filter(({ l }) => (l.stage || 'nuevo') === s.id)
            return (
              <div
                key={s.id}
                className={'col' + (over === s.id ? ' drop' : '')}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(s.id)
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => {
                  setOver(null)
                  if (drag) move(drag, s.id)
                }}
              >
                <div className="col-h">
                  {s.label} <span>{col.length}</span>
                </div>
                {col.slice(0, 80).map(({ l, i, tier }) => (
                  <div key={l.id} className={'lead-card tier-' + tier} draggable onDragStart={() => setDrag(l.id)} onClick={() => setOpen(l)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(l)}>
                    <b>{i.name}</b>
                    {i.vehicle}
                    <div className="small muted">
                      {i.group} · {tier}
                      {!l.tier && ' (sugerida)'} · {ago(l.created_at)}
                    </div>
                    {l.offer_usd && <div className="small">Oferta {usd(l.offer_usd)}</div>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table className="t">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Auto</th>
                <th>Servicio</th>
                <th>Calificación</th>
                <th>Etapa</th>
                <th className="num">Oferta</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ l, i, tier }) => (
                <tr key={l.id} onClick={() => setOpen(l)} style={{ cursor: 'pointer' }}>
                  <td>{new Date(l.created_at).toLocaleDateString('es-PE')}</td>
                  <td>
                    {i.name}
                    <div className="small muted">{i.phone}</div>
                  </td>
                  <td>{i.vehicle}</td>
                  <td>{i.group}</td>
                  <td>{tier}</td>
                  <td>{STAGES.find((s) => s.id === (l.stage || 'nuevo'))?.label}</td>
                  <td className="num">{l.offer_usd ? usd(l.offer_usd) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <LeadDrawer
          lead={open}
          cfg={cfg}
          onClose={() => setOpen(null)}
          onSaved={(nl) => {
            setLeads(leads.map((x) => (x.id === nl.id ? nl : x)))
            setOpen(null)
          }}
        />
      )}
    </>
  )
}
