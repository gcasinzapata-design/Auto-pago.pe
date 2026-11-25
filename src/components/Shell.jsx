import { useState } from 'react'
import { Link } from 'react-router-dom'
import { wa } from '../lib/config'

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="AutoPago, inicio">
      <span className="brand-mark" aria-hidden="true" />
      AutoPago
    </Link>
  )
}

export function Nav({ cfg }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Brand />
        <button className="burger" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(!open)}>
          ☰
        </button>
        <nav className={'nav-links' + (open ? ' open' : '')} onClick={close}>
          <a href="/#tasar">Tasar mi auto</a>
          {cfg.modules.seminuevos && <Link to="/seminuevos">Seminuevos</Link>}
          <a href="/#servicios">Servicios</a>
          <Link to="/faq">Preguntas</Link>
          <Link to="/revendedores">Revendedores</Link>
          <a className="btn btn-wa btn-sm" href={wa(cfg.whatsapp, 'Hola AutoPago, quiero vender mi auto')} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  )
}

export function Footer({ cfg }) {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Brand />
          <p className="small" style={{ marginTop: 10 }}>
            Compramos, consignamos y financiamos autos en Lima Metropolitana.
          </p>
        </div>
        <div className="stack small">
          <a href={wa(cfg.whatsapp, 'Hola AutoPago')} target="_blank" rel="noreferrer">
            WhatsApp +{cfg.whatsapp}
          </a>
          <Link to="/faq">Preguntas frecuentes</Link>
          <Link to="/revendedores">Portal de revendedores</Link>
        </div>
        <div className="stack small">
          <a href="/terminos">Términos y condiciones</a>
          <a href="/privacidad">Política de privacidad</a>
          <span>© {new Date().getFullYear()} AutoPago, Lima</span>
        </div>
      </div>
    </footer>
  )
}

export function Plate({ value, caption, empty, revealKey }) {
  return (
    <div className={'plate' + (empty ? ' empty' : ' reveal')} key={revealKey} aria-live="polite">
      <div className="plate-num">{value}</div>
      {caption && <div className="plate-cap">{caption}</div>}
    </div>
  )
}
