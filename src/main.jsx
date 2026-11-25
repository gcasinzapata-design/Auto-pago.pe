import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import { DEFAULT_CFG, loadConfig } from './lib/config'
import { bootAnalytics } from './lib/track'
import { Home, Seminuevos, Faq } from './pages/Public'
const Revendedores = lazy(() => import('./pages/Revendedores'))
const Admin = lazy(() => import('./pages/admin/Admin'))

function App() {
  const [cfg, setCfg] = useState(DEFAULT_CFG)
  useEffect(() => {
    loadConfig().then(setCfg).catch(() => {})
    bootAnalytics()
  }, [])
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="auth" />}>
      <Routes>
        <Route path="/" element={<Home cfg={cfg} />} />
        <Route path="/seminuevos" element={<Seminuevos cfg={cfg} />} />
        <Route path="/faq" element={<Faq cfg={cfg} />} />
        <Route path="/revendedores" element={<Revendedores />} />
        <Route path="/admin" element={<Admin cfg={cfg} setCfg={setCfg} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
