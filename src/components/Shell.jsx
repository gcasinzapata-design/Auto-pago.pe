import { useState } from 'react'
import { Link } from 'react-router-dom'
import { wa } from '../lib/config'
import { Menu, WhatsApp, Book } from './Icons'

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="AutoPago, inicio">
      <span className="brand-mark" aria-hidden="true">AP</span>
      AutoPago
    </Link>
  )
}

export function Nav({ cfg }) {
  const [open, setOpen] = useState(false)
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Brand />
        <button className="burger" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Menu width="24" height="24" />
        </button>
        <nav className={'nav-links' + (open ? ' open' : '')} onClick={() => setOpen(false)}>
          <a href="/#como">Cómo funciona</a>
          <a href="/#servicios">Servicios</a>
          {cfg.modules.seminuevos && <Link to="/seminuevos">Seminuevos</Link>}
          <Link to="/faq">Preguntas</Link>
          <Link to="/revendedores">Revendedores</Link>
          <a className="btn btn-wa btn-sm" href={wa(cfg.whatsapp, 'Hola AutoPago, quiero vender mi auto')} target="_blank" rel="noreferrer">
            <WhatsApp /> Escríbenos
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
        <div style={{ maxWidth: 320 }}>
          <Brand />
          <p style={{ marginTop: 12 }}>Compramos, consignamos y financiamos autos en Lima Metropolitana. Transferencias ante notario e inscritas en SUNARP.</p>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <a href={wa(cfg.whatsapp, 'Hola AutoPago')} target="_blank" rel="noreferrer">
            WhatsApp +{cfg.whatsapp}
          </a>
          <Link to="/faq">Preguntas frecuentes</Link>
          <Link to="/revendedores">Portal de revendedores</Link>
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <Link to="/terminos">Términos y condiciones</Link>
          <Link to="/privacidad">Política de privacidad</Link>
          <Link to="/libro-de-reclamaciones" className="lr-link">
            <Book width="18" height="18" /> Libro de Reclamaciones
          </Link>
          <span>© {new Date().getFullYear()} AutoPago · Lima, Perú</span>
        </div>
      </div>
    </footer>
  )
}

export function Result({ label, value, caption, state = 'empty', revealKey }) {
  return (
    <div className={'result ' + (state === 'on' ? 'on reveal' : 'empty')} key={revealKey} aria-live="polite">
      <div className="result-label">{label}</div>
      <div className="result-num">{value}</div>
      {caption && <div className="result-cap">{caption}</div>}
    </div>
  )
}
