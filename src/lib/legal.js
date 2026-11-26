// Datos legales del titular. Completar razón social, RUC y domicilio fiscal: se muestran en T&C y Privacidad.
export const LEGAL = {
  nombreComercial: 'AutoPago',
  razonSocial: '', // p. ej. 'AutoPago S.A.C.'
  ruc: '', // 11 dígitos
  domicilio: 'Lima, Perú',
  emailLegal: 'legal@autopago.pe',
  emailPrivacidad: 'privacidad@autopago.pe',
  whatsapp: '+51 970 625 242',
  version: '2.0',
  vigencia: '26 de noviembre de 2026',
}

export const titular = () =>
  LEGAL.razonSocial
    ? `${LEGAL.razonSocial}${LEGAL.ruc ? `, con RUC ${LEGAL.ruc}` : ''}, que opera bajo el nombre comercial ${LEGAL.nombreComercial}`
    : LEGAL.nombreComercial
