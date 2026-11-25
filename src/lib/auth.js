import { useEffect, useState } from 'react'
import { supabase } from './config'

// Sesión + perfil (ap_profiles) del usuario actual.
export function useProfile() {
  const [state, setState] = useState({ loading: true, session: null, profile: null })
  useEffect(() => {
    let live = true
    const load = async (session) => {
      if (!session) return live && setState({ loading: false, session: null, profile: null })
      const { data } = await supabase.from('ap_profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      if (live) setState({ loading: false, session, profile: data })
    }
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => load(s))
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [])
  const reload = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    const { data: p } = await supabase.from('ap_profiles').select('*').eq('user_id', data.session.user.id).maybeSingle()
    setState({ loading: false, session: data.session, profile: p })
  }
  return { ...state, reload }
}

export const signOut = () => supabase.auth.signOut()

export const authError = (e) => {
  const m = e?.message || ''
  if (/Invalid login/i.test(m)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(m)) return 'Confirma tu correo con el enlace que te enviamos y vuelve a entrar.'
  if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.'
  if (/Password should be/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.'
  return m || 'No se pudo completar. Inténtalo otra vez.'
}
