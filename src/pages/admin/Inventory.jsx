import { useState } from 'react'
import { supabase, usd } from '../../lib/config'
import { toRow, toPrivate } from '../../lib/inventory'
import { BRANDS } from '../../lib/valuation'

const EMPTY = { brand: '', model: '', year: new Date().getFullYear() - 4, km: '', fuel: 'Gasolina', trans: 'Automática', color: '', price: '', status: 'disponible', images: [], wholesale: false, wholesalePrice: '', minBid: '', auctionEndsAt: '', costUsd: '', notes: '' }

function Editor({ car, onClose, onSaved }) {
  const [f, setF] = useState(car ? { ...EMPTY, ...car, auctionEndsAt: car.auctionEndsAt ? car.auctionEndsAt.slice(0, 16) : '' } : EMPTY)
  const [img, setImg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = async () => {
    if (!f.brand || !f.model) return setErr('Marca y modelo son obligatorios.')
    if (!f.price && !f.wholesale) return setErr('Pon un precio público o márcalo como mayorista.')
    setBusy(true)
    const id = car?.id || 'V' + Date.now().toString(36)
    const row = toRow(f)
    const r1 = car
      ? await supabase.from('ap_inventory').update(row).eq('id', id)
      : await supabase.from('ap_inventory').insert({ ...row, id, sort_order: Date.now() % 1e6 })
    const r2 = r1.error ? r1 : await supabase.from('ap_inventory_private').upsert(toPrivate(id, f))
    setBusy(false)
    if (r1.error || r2.error) return setErr('No se pudo guardar: ' + (r1.error || r2.error).message)
    onSaved()
  }
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" aria-label="Cerrar" onClick={onClose}>
          ×
        </button>
        <h2 style={{ fontSize: 32 }}>{car ? 'Editar auto' : 'Agregar auto'}</h2>
        <div className="grid3">
          <div className="field">
            <label htmlFor="i-brand">Marca</label>
            <input id="i-brand" className="input" list="brands" value={f.brand} onChange={set('brand')} />
            <datalist id="brands">
              {BRANDS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="i-model">Modelo</label>
            <input id="i-model" className="input" value={f.model} onChange={set('model')} />
          </div>
          <div className="field">
            <label htmlFor="i-year">Año</label>
            <input id="i-year" className="input" type="number" value={f.year} onChange={set('year')} />
          </div>
          <div className="field">
            <label htmlFor="i-km">Km</label>
            <input id="i-km" className="input" type="number" value={f.km ?? ''} onChange={set('km')} />
          </div>
          <div className="field">
            <label htmlFor="i-trans">Transmisión</label>
            <select id="i-trans" className="select" value={f.trans || ''} onChange={set('trans')}>
              <option>Automática</option>
              <option>Mecánica</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="i-fuel">Combustible</label>
            <select id="i-fuel" className="select" value={f.fuel || ''} onChange={set('fuel')}>
              <option>Gasolina</option>
              <option>Diésel</option>
              <option>Híbrido</option>
              <option>GLP</option>
              <option>GNV</option>
              <option>Eléctrico</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="i-color">Color</label>
            <input id="i-color" className="input" value={f.color || ''} onChange={set('color')} />
          </div>
          <div className="field">
            <label htmlFor="i-price">Precio público (US$)</label>
            <input id="i-price" className="input" type="number" value={f.price || ''} onChange={set('price')} />
          </div>
          <div className="field">
            <label htmlFor="i-status">Estado</label>
            <select id="i-status" className="select" value={f.status} onChange={set('status')}>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="i-img">Fotos (enlace de Google Drive o URL)</label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <input id="i-img" className="input" value={img} onChange={(e) => setImg(e.target.value)} />
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                if (img.trim()) setF({ ...f, images: [...(f.images || []), img.trim()] })
                setImg('')
              }}
            >
              Agregar
            </button>
          </div>
          <div className="row">
            {(f.images || []).map((src, k) => (
              <span key={k} className="tag">
                Foto {k + 1}{' '}
                <button aria-label={`Quitar foto ${k + 1}`} style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== k) })}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <fieldset className="panel stack" style={{ background: '#f7f8f5' }}>
          <legend className="small" style={{ fontWeight: 700, padding: '0 6px' }}>
            Solo visible para ti y revendedores aprobados
          </legend>
          <label className="row">
            <input type="checkbox" checked={!!f.wholesale} onChange={set('wholesale')} /> Publicar en el portal de revendedores
          </label>
          <div className="grid3">
            <div className="field">
              <label htmlFor="i-cost">Costo de compra (US$, solo tú)</label>
              <input id="i-cost" className="input" type="number" value={f.costUsd || ''} onChange={set('costUsd')} />
            </div>
            <div className="field">
              <label htmlFor="i-wp">Precio mayorista (US$)</label>
              <input id="i-wp" className="input" type="number" value={f.wholesalePrice || ''} onChange={set('wholesalePrice')} />
            </div>
            <div className="field">
              <label htmlFor="i-mb">Oferta mínima (US$)</label>
              <input id="i-mb" className="input" type="number" value={f.minBid || ''} onChange={set('minBid')} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="i-end">Cierre de ofertas (opcional)</label>
            <input id="i-end" className="input" type="datetime-local" value={f.auctionEndsAt || ''} onChange={set('auctionEndsAt')} />
          </div>
          <div className="field">
            <label htmlFor="i-notes">Notas internas</label>
            <textarea id="i-notes" className="input" rows={2} value={f.notes || ''} onChange={set('notes')} />
          </div>
        </fieldset>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={busy} onClick={save}>
          {busy ? 'Guardando…' : car ? 'Guardar cambios' : 'Agregar auto'}
        </button>
      </div>
    </div>
  )
}

export default function Inventory({ cars, reload }) {
  const [edit, setEdit] = useState(null)
  const del = async (c) => {
    if (!window.confirm(`¿Eliminar ${c.brand} ${c.model} ${c.year}? No se puede deshacer.`)) return
    await supabase.from('ap_inventory').delete().eq('id', c.id)
    reload()
  }
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Inventario</h1>
        <button className="btn btn-signal" onClick={() => setEdit('new')}>
          Agregar auto
        </button>
      </div>
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="t">
          <thead>
            <tr>
              <th>Auto</th>
              <th>Estado</th>
              <th className="num">Costo</th>
              <th className="num">Público</th>
              <th className="num">Mayorista</th>
              <th className="num">Margen est.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  Aún no hay autos. Agrega el primero.
                </td>
              </tr>
            )}
            {cars.map((c) => {
              const sale = c.price || c.wholesalePrice
              return (
                <tr key={c.id}>
                  <td>
                    <b>
                      {c.brand} {c.model} {c.year}
                    </b>
                    <div className="small muted">
                      {c.km != null && `${(+c.km).toLocaleString('es-PE')} km`} {c.wholesale && ' · en portal revendedores'}
                    </div>
                  </td>
                  <td>{c.status}</td>
                  <td className="num">{c.costUsd ? usd(c.costUsd) : '—'}</td>
                  <td className="num">{c.price ? usd(c.price) : '—'}</td>
                  <td className="num">{c.wholesalePrice ? usd(c.wholesalePrice) : '—'}</td>
                  <td className="num">{c.costUsd && sale ? usd(sale - c.costUsd) : '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEdit(c)}>
                      Editar
                    </button>{' '}
                    <button className="btn btn-sm btn-ghost" onClick={() => del(c)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {edit && (
        <Editor
          car={edit === 'new' ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null)
            reload()
          }}
        />
      )}
    </>
  )
}
