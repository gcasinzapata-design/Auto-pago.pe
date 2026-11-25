import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, usd } from '../../lib/config'
import { useProfile, signOut } from '../../lib/auth'
import { loadAdminInventory } from '../../lib/inventory'
import { leadInfo, suggestTier, STAGES } from '../../lib/leads'
import { AuthBox } from '../Revendedores'
import { Brand } from '../../components/Shell'
import CRM from './CRM'
import Inventory from './Inventory'
import Resellers from './Resellers'
import Market from './Market'

function Summary({ leads, cars, go }) {
  const week = Date.now() - 7 * 864e5
  const k = useMemo(() => {
    const recent = leads.filter((l) => new Date(l.created_at) > week)
    const open = leads.filter((l) => !['cerrado', 'perdido'].includes(l.stage || 'nuevo'))
    const closed = leads.filter((l) => l.stage === 'cerrado').length
    const due = leads.filter((l) => l.next_action_at && new Date(l.next_action_at) < new Date() && !['cerrado', 'perdido'].includes(l.stage))
    const hot = open.filter((l) => (l.tier || suggestTier(l)) === 'ALTA' && (l.stage || 'nuevo') === 'nuevo')
    const live = cars.filter((c) => c.status !== 'vendido')
    const stock = live.reduce((s, c) => s + (c.costUsd || 0), 0)
    return { recent: recent.length, open: open.length, closed, conv: leads.length ? (closed / leads.length) * 100 : 0, due, hot, live: live.length, stock }
  }, [leads, cars]) // eslint-disable-line
  return (
    <>
      <h1>Resumen</h1>
      <div className="kpis">
        <div className="kpi">
          Leads esta semana<b>{k.recent}</b>
        </div>
        <div className="kpi">
          Leads abiertos<b>{k.open}</b>
        </div>
        <div className="kpi">
          Conversión a compra<b>{k.conv.toFixed(1)}%</b>
        </div>
        <div className="kpi">
          Capital en stock<b>{usd(k.stock)}</b>
          <span className="small muted">{k.live} autos</span>
        </div>
      </div>
      <div className="grid2">
        <div className="panel">
          <h3>Leads ALTA sin contactar ({k.hot.length})</h3>
          {k.hot.slice(0, 8).map((l) => {
            const i = leadInfo(l)
            return (
              <p key={l.id} className="small" style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                <b>{i.name}</b> · {i.vehicle}
              </p>
            )
          })}
          {k.hot.length === 0 && <p className="small muted">Todo contactado.</p>}
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => go('crm')}>
            Abrir tablero
          </button>
        </div>
        <div className="panel">
          <h3>Seguimientos vencidos ({k.due.length})</h3>
          {k.due.slice(0, 8).map((l) => {
            const i = leadInfo(l)
            return (
              <p key={l.id} className="small" style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                <b>{i.name}</b> · {STAGES.find((s) => s.id === l.stage)?.label} · {new Date(l.next_action_at).toLocaleDateString('es-PE')}
              </p>
            )
          })}
          {k.due.length === 0 && <p className="small muted">Sin pendientes vencidos.</p>}
        </div>
      </div>
    </>
  )
}

function Settings({ cfg, setCfg }) {
  const [f, setF] = useState(cfg)
  const [msg, setMsg] = useState('')
  const save = async () => {
    const raw = cfg._raw || {}
    const config = {
      ...raw,
      general: { ...(raw.general || {}), whatsappNumber: f.whatsapp.replace(/\D/g, '') },
      consigna: { ...(raw.consigna || {}), commissionPct: +f.commission / 100 },
      penalties: f.penalties,
      margin: { pct: +f.margin.pct, minUsd: +f.margin.minUsd },
      modules: { ...(raw.modules || {}), comprar: f.modules.compramos, consigna: f.modules.consigna, credito: f.modules.prestamos, seminuevos: f.modules.seminuevos },
    }
    const { error } = await supabase.from('ap_admin_config').update({ config, updated_at: new Date().toISOString() }).eq('id', 1)
    setMsg(error ? 'No se pudo guardar: ' + error.message : 'Ajustes guardados.')
    if (!error) setCfg({ ...f, _raw: config })
  }
  const mods = [
    ['compramos', 'Compra inmediata'],
    ['consigna', 'Consignación'],
    ['prestamos', 'Préstamos'],
    ['seminuevos', 'Seminuevos'],
  ]
  return (
    <>
      <h1>Ajustes</h1>
      <div className="panel stack" style={{ maxWidth: 720 }}>
        <div className="grid3">
          <div className="field">
            <label htmlFor="c-wa">WhatsApp</label>
            <input id="c-wa" className="input" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="c-com">Comisión consignación (%)</label>
            <input id="c-com" className="input" type="number" value={f.commission} onChange={(e) => setF({ ...f, commission: e.target.value })} />
          </div>
          <div />
          <div className="field">
            <label htmlFor="c-mp">Margen objetivo (%)</label>
            <input id="c-mp" className="input" type="number" value={f.margin.pct} onChange={(e) => setF({ ...f, margin: { ...f.margin, pct: e.target.value } })} />
          </div>
          <div className="field">
            <label htmlFor="c-mm">Margen mínimo (US$)</label>
            <input id="c-mm" className="input" type="number" value={f.margin.minUsd} onChange={(e) => setF({ ...f, margin: { ...f.margin, minUsd: e.target.value } })} />
          </div>
        </div>
        <h3>Castigo por origen (%)</h3>
        <div className="grid3">
          {Object.entries(f.penalties).map(([o, v]) => (
            <div className="field" key={o}>
              <label htmlFor={'p-' + o} style={{ textTransform: 'capitalize' }}>
                {o}
              </label>
              <input id={'p-' + o} className="input" type="number" value={v} onChange={(e) => setF({ ...f, penalties: { ...f.penalties, [o]: +e.target.value } })} />
            </div>
          ))}
        </div>
        <h3>Servicios visibles en la web</h3>
        {mods.map(([k, l]) => (
          <label key={k} className="row">
            <input type="checkbox" checked={f.modules[k]} onChange={(e) => setF({ ...f, modules: { ...f.modules, [k]: e.target.checked } })} /> {l}
          </label>
        ))}
        {msg && <p className={msg.startsWith('No') ? 'err' : 'okmsg'}>{msg}</p>}
        <button className="btn" style={{ alignSelf: 'start' }} onClick={save}>
          Guardar ajustes
        </button>
      </div>
    </>
  )
}

function Dashboard({ cfg, setCfg }) {
  const [tab, setTab] = useState('resumen')
  const [leads, setLeads] = useState([])
  const [cars, setCars] = useState([])
  const [pending, setPending] = useState(0)
  const reloadCars = useCallback(() => loadAdminInventory().then(setCars), [])
  useEffect(() => {
    supabase
      .from('ap_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data }) => setLeads(data || []))
    supabase
      .from('ap_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('approved', false)
      .then(({ count }) => setPending(count || 0))
    reloadCars()
    // Leads nuevos en vivo
    const ch = supabase
      .channel('ap_leads_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ap_leads' }, (p) => setLeads((l) => [p.new, ...l]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [reloadCars])
  const newCount = leads.filter((l) => (l.stage || 'nuevo') === 'nuevo').length
  const tabs = [
    ['resumen', 'Resumen'],
    ['crm', 'Leads', newCount],
    ['inventario', 'Inventario', cars.filter((c) => c.status !== 'vendido').length],
    ['revendedores', 'Revendedores', pending || ''],
    ['tasacion', 'Tasación'],
    ['ajustes', 'Ajustes'],
  ]
  return (
    <div className="app">
      <aside className="side">
        <Brand to="/admin" />
        {tabs.map(([id, l, c]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {l} {c ? <span className="count">{c}</span> : null}
          </button>
        ))}
        <button onClick={signOut} style={{ marginTop: 'auto' }}>
          Salir
        </button>
      </aside>
      <div className="main">
        {tab === 'resumen' && <Summary leads={leads} cars={cars} go={setTab} />}
        {tab === 'crm' && <CRM cfg={cfg} leads={leads} setLeads={setLeads} />}
        {tab === 'inventario' && <Inventory cars={cars} reload={reloadCars} />}
        {tab === 'revendedores' && <Resellers cars={cars} reloadCars={reloadCars} />}
        {tab === 'tasacion' && <Market cfg={cfg} />}
        {tab === 'ajustes' && <Settings cfg={cfg} setCfg={setCfg} />}
      </div>
    </div>
  )
}

export default function Admin({ cfg, setCfg }) {
  const { loading, session, profile } = useProfile()
  if (loading) return <div className="auth" />
  if (!session) return <AuthBox title="Panel AutoPago" sub="Entra con tu cuenta de administrador." allowSignup signupLabel="Primera vez: crear mi cuenta" signupTitle="Crear cuenta de administrador" />
  if (profile?.role !== 'admin')
    return (
      <div className="auth">
        <div className="panel stack">
          <Brand />
          <p>Esta cuenta no tiene acceso al panel.</p>
          <button className="btn btn-ghost" onClick={signOut}>
            Salir
          </button>
        </div>
      </div>
    )
  return <Dashboard cfg={cfg} setCfg={setCfg} />
}
