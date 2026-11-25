import { useCallback, useEffect, useState } from 'react'
import { supabase, usd, wa } from '../../lib/config'
import { ago } from '../../lib/leads'

export default function Resellers({ cars, reloadCars }) {
  const [people, setPeople] = useState([])
  const [bids, setBids] = useState([])
  const load = useCallback(async () => {
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from('ap_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('ap_bids').select('*').order('created_at', { ascending: false }).limit(300),
    ])
    setPeople(p || [])
    setBids(b || [])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const byId = Object.fromEntries(people.map((p) => [p.user_id, p]))
  const carById = Object.fromEntries(cars.map((c) => [c.id, c]))
  const setApproved = async (p, approved) => {
    await supabase.from('ap_profiles').update({ approved }).eq('user_id', p.user_id)
    load()
  }
  const accept = async (b) => {
    const c = carById[b.inventory_id]
    if (!window.confirm(`¿Aceptar ${usd(b.amount_usd)} de ${byId[b.reseller_id]?.name || 'este revendedor'} por el ${c?.brand} ${c?.model}? El auto pasa a Reservado.`)) return
    await supabase.from('ap_bids').update({ status: 'rechazada' }).eq('inventory_id', b.inventory_id).eq('status', 'activa').neq('id', b.id)
    await supabase.from('ap_bids').update({ status: 'aceptada' }).eq('id', b.id)
    await supabase.from('ap_inventory').update({ status: 'reservado' }).eq('id', b.inventory_id)
    load()
    reloadCars()
  }

  const pending = people.filter((p) => p.role === 'reseller' && !p.approved)
  const active = people.filter((p) => p.role === 'reseller' && p.approved)
  const live = cars.filter((c) => c.wholesale && c.status !== 'vendido')

  return (
    <>
      <h1>Revendedores</h1>
      <div className="stack" style={{ gap: 20 }}>
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Solicitudes por aprobar ({pending.length})</h3>
          {pending.length === 0 ? (
            <p className="muted small">No hay solicitudes nuevas. Comparte autopago.pe/revendedores con tus compradores.</p>
          ) : (
            <table className="t">
              <tbody>
                {pending.map((p) => (
                  <tr key={p.user_id}>
                    <td>
                      <b>{p.name || p.email}</b>
                      <div className="small muted">
                        {p.company || 'Sin empresa'} · {p.phone} · {p.email} · {ago(p.created_at)}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {p.phone && (
                        <a className="btn btn-sm btn-ghost" target="_blank" rel="noreferrer" href={wa(p.phone.replace(/\D/g, ''), `Hola ${p.name?.split(' ')[0] || ''}, te escribe AutoPago por tu registro como revendedor.`)}>
                          WhatsApp
                        </a>
                      )}{' '}
                      <button className="btn btn-sm" onClick={() => setApproved(p, true)}>
                        Aprobar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Ofertas por auto</h3>
          {live.length === 0 && <p className="muted small">Ningún auto está publicado para revendedores. Actívalo desde Inventario.</p>}
          {live.map((c) => {
            const cb = bids.filter((b) => b.inventory_id === c.id).sort((a, b) => b.amount_usd - a.amount_usd)
            return (
              <div key={c.id} style={{ borderTop: '1px solid var(--line)', padding: '12px 0' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>
                    {c.brand} {c.model} {c.year}
                  </b>
                  <span className="small muted">
                    Costo {c.costUsd ? usd(c.costUsd) : '—'} · Mayorista {c.wholesalePrice ? usd(c.wholesalePrice) : '—'} · {c.status}
                  </span>
                </div>
                {cb.length === 0 ? (
                  <p className="small muted">Sin ofertas.</p>
                ) : (
                  <table className="t" style={{ marginTop: 6 }}>
                    <tbody>
                      {cb.map((b) => (
                        <tr key={b.id}>
                          <td>{byId[b.reseller_id]?.name || 'Revendedor'}</td>
                          <td className="num">{usd(b.amount_usd)}</td>
                          <td className="num">{c.costUsd ? usd(b.amount_usd - c.costUsd) : ''}</td>
                          <td className="small muted">{ago(b.created_at)}</td>
                          <td style={{ textAlign: 'right' }}>
                            {b.status === 'activa' ? (
                              <button className="btn btn-sm" onClick={() => accept(b)}>
                                Aceptar
                              </button>
                            ) : (
                              <span className="tag">{b.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>

        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Revendedores activos ({active.length})</h3>
          <table className="t">
            <tbody>
              {active.map((p) => (
                <tr key={p.user_id}>
                  <td>
                    <b>{p.name || p.email}</b>
                    <div className="small muted">
                      {p.company} · {p.phone}
                    </div>
                  </td>
                  <td className="num">{bids.filter((b) => b.reseller_id === p.user_id).length} ofertas</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setApproved(p, false)}>
                      Quitar acceso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
