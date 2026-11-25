import { supabase } from './config'

// IDs opcionales: configúralos en Vercel → Settings → Environment Variables
const GA4 = import.meta.env.VITE_GA4_ID
const PIXEL = import.meta.env.VITE_META_PIXEL_ID

let booted = false
let session = null

function sid() {
  if (session) return session
  try {
    session = sessionStorage.getItem('ap_sid')
    if (!session) {
      session = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('ap_sid', session)
    }
  } catch {
    session = session || Math.random().toString(36).slice(2)
  }
  return session
}

export function bootAnalytics() {
  if (booted || typeof window === 'undefined') return
  booted = true
  if (GA4) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4}`
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments) // eslint-disable-line prefer-rest-params
    }
    window.gtag('js', new Date())
    window.gtag('config', GA4)
  }
  if (PIXEL) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
      if (!f._fbq) f._fbq = n
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
    window.fbq('init', PIXEL)
    window.fbq('track', 'PageView')
  }
}

const META_STD = { lead_submitted: 'Lead', quote_shown: 'ViewContent', tasador_start: 'InitiateCheckout' }

// Evento del embudo: va a GA4, Meta Pixel y a Supabase (ap_funnel_events) para verlo en el admin.
export function track(event, props = {}) {
  try {
    if (window.gtag) window.gtag('event', event, props)
    if (window.fbq) {
      if (META_STD[event]) window.fbq('track', META_STD[event], props)
      else window.fbq('trackCustom', event, props)
    }
  } catch {
    /* noop */
  }
  supabase
    .from('ap_funnel_events')
    .insert({ session_id: sid(), event, step: props.step ?? null, props, path: location.pathname })
    .then(() => {}, () => {})
}
