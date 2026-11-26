import { Link } from 'react-router-dom'

// Casilla de consentimiento (Ley 29733): obligatoria antes de enviar datos personales.
export default function Consent({ checked, onChange, id = 'consent' }) {
  return (
    <label className="consent" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        Acepto los{' '}
        <Link to="/terminos" target="_blank">
          Términos
        </Link>{' '}
        y la{' '}
        <Link to="/privacidad" target="_blank">
          Política de privacidad
        </Link>
        , y que AutoPago me contacte por WhatsApp sobre esta solicitud.
      </span>
    </label>
  )
}
