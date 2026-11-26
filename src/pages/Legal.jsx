import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Nav, Footer } from '../components/Shell'
import { LEGAL, titular } from '../lib/legal'
import { Shield, Lock } from '../components/Icons'

function LegalLayout({ cfg, title, kicker, intro, sections, children }) {
  useEffect(() => {
    document.title = `${title} | AutoPago`
    window.scrollTo(0, 0)
  }, [title])
  return (
    <>
      <Nav cfg={cfg} />
      <main className="legal">
        <header className="legal-hero">
          <div className="wrap">
            <span className="pill">
              <span className="dot" /> {kicker}
            </span>
            <h1>{title}</h1>
            <p className="lead">{intro}</p>
            <p className="small muted">
              Versión {LEGAL.version} · Vigente desde el {LEGAL.vigencia}
            </p>
          </div>
        </header>
        <div className="wrap legal-grid">
          <nav className="legal-toc" aria-label="Contenido">
            <b>Contenido</b>
            <ol>
              {sections.map(([id, t]) => (
                <li key={id}>
                  <a href={`#${id}`}>{t}</a>
                </li>
              ))}
            </ol>
            <div className="legal-alt">
              {title.startsWith('Términos') ? <Link to="/privacidad">Política de privacidad</Link> : <Link to="/terminos">Términos y condiciones</Link>}
            </div>
          </nav>
          <article className="legal-body">{children}</article>
        </div>
      </main>
      <Footer cfg={cfg} />
    </>
  )
}

const S = ({ id, n, t, children }) => (
  <section id={id} className="legal-sec">
    <h2>
      <span>{n}.</span> {t}
    </h2>
    {children}
  </section>
)

const Note = ({ icon = 'shield', children }) => (
  <div className="legal-note">
    {icon === 'lock' ? <Lock /> : <Shield />}
    <div>{children}</div>
  </div>
)

const T_SECTIONS = [
  ['quienes', 'Quiénes somos'],
  ['aceptacion', 'Aceptación y capacidad'],
  ['servicios', 'Servicios'],
  ['preoferta', 'Pre-ofertas y tasación'],
  ['congelado', 'Precio congelado por 48 horas'],
  ['compra', 'Compra inmediata'],
  ['vendedor', 'Declaraciones del vendedor'],
  ['consigna', 'Consignación'],
  ['prestamos', 'Préstamos con garantía'],
  ['seminuevos', 'Venta de seminuevos'],
  ['revendedores', 'Portal de revendedores'],
  ['uso', 'Uso permitido'],
  ['comunicaciones', 'Comunicaciones'],
  ['pi', 'Propiedad intelectual'],
  ['responsabilidad', 'Responsabilidad'],
  ['reclamos', 'Reclamos'],
  ['cambios', 'Cambios'],
  ['ley', 'Ley aplicable'],
]

export function Terminos({ cfg }) {
  return (
    <LegalLayout
      cfg={cfg}
      title="Términos y condiciones"
      kicker="Documento legal"
      intro="Las reglas para usar autopago.pe y nuestros servicios de compra, consignación, préstamos y venta de autos."
      sections={T_SECTIONS}
    >
      <Note>
        <b>Lo esencial en una línea.</b> La pre-oferta que ves en la web es una referencia calculada con datos de mercado. El precio final se fija por escrito después de revisar tu auto y sus documentos, y nadie queda obligado a comprar ni vender hasta firmar el contrato.
      </Note>

      <S id="quienes" n={1} t="Quiénes somos">
        <p>
          autopago.pe es operado por {titular()}, con domicilio en {LEGAL.domicilio} (en adelante, «AutoPago»). Puedes escribirnos a <a href={`mailto:${LEGAL.emailLegal}`}>{LEGAL.emailLegal}</a> o por WhatsApp al {LEGAL.whatsapp}.
        </p>
      </S>

      <S id="aceptacion" n={2} t="Aceptación y capacidad">
        <p>Al usar la web o enviarnos una solicitud aceptas estos términos y la <Link to="/privacidad">Política de privacidad</Link>. Si no estás de acuerdo, no uses la web.</p>
        <p>Nuestros servicios son solo para personas mayores de 18 años con capacidad legal para contratar. Si actúas por una empresa o por otra persona, declaras tener facultades suficientes para hacerlo.</p>
      </S>

      <S id="servicios" n={3} t="Servicios">
        <ul>
          <li><b>Compra inmediata:</b> compramos tu auto usado y te pagamos al firmar la transferencia.</li>
          <li><b>Consignación:</b> vendemos tu auto por encargo tuyo a cambio de una comisión.</li>
          <li><b>Préstamos con garantía:</b> préstamos de dinero garantizados con tu vehículo.</li>
          <li><b>Venta de seminuevos:</b> exhibimos y vendemos autos de nuestro inventario.</li>
          <li><b>Portal de revendedores:</b> acceso privado para compradores profesionales aprobados.</li>
        </ul>
        <p>Cada operación se formaliza con un contrato escrito propio. Si algo de ese contrato difiere de estos términos, prevalece el contrato.</p>
      </S>

      <S id="preoferta" n={4} t="Pre-ofertas y tasación">
        <p>La pre-oferta se calcula automáticamente con los datos que ingresas (marca, modelo, año, kilometraje y estado), precios de avisos de autos similares publicados en Lima y nuestros parámetros comerciales. Cada pre-oferta tiene un número de folio para identificarla.</p>
        <p>La pre-oferta es <b>referencial y no vinculante</b>. Conforme al artículo 1388 del Código Civil, constituye una invitación a negociar y no una oferta de compra. El precio final puede ser distinto y depende de:</p>
        <ul>
          <li>La revisión física y mecánica del vehículo.</li>
          <li>La verificación de la tarjeta de propiedad, SOAT, revisión técnica, papeletas, impuesto vehicular y cargas o gravámenes en SUNARP.</li>
          <li>Que los datos declarados coincidan con la realidad.</li>
          <li>La disponibilidad de AutoPago para comprar ese modelo en ese momento.</li>
        </ul>
        <p>El monto de pago inmediato es menor al valor comercial del auto porque incluye nuestros costos de trámite, reacondicionamiento, financiamiento del inventario y el riesgo de reventa.</p>
      </S>

      <S id="congelado" n={5} t="Precio congelado por 48 horas">
        <p>Si dejas tu nombre y celular, mantenemos el rango de tu pre-oferta como referencia durante 48 horas desde su emisión, para que coordines la revisión. Durante ese plazo no ajustaremos el rango por cambios del mercado.</p>
        <p>El precio congelado aplica solo si:</p>
        <ul>
          <li>La revisión se realiza dentro de las 48 horas.</li>
          <li>El vehículo coincide con lo declarado: modelo, versión, año, kilometraje y estado.</li>
          <li>La documentación está en regla y no aparecen deudas, cargas, siniestros o restricciones no informadas.</li>
        </ul>
        <p>Congelar el precio no obliga a AutoPago a comprar ni a ti a vender. Si la revisión o la verificación documental revelan diferencias, el monto se recalcula o la operación puede no concretarse.</p>
      </S>

      <S id="compra" n={6} t="Compra inmediata">
        <ul>
          <li>El precio final se acuerda por escrito tras la revisión. La transferencia se firma ante notario y se inscribe en SUNARP.</li>
          <li>Pagamos por transferencia bancaria a una cuenta a nombre del propietario registral, en el acto de firma o según lo pactado en el contrato.</li>
          <li>Si el vehículo tiene una deuda o garantía inscrita, podemos pagarla directamente al acreedor y descontarla del precio. Te entregamos el detalle por escrito.</li>
          <li>Los gastos notariales y registrales de la transferencia los asume AutoPago, salvo que el contrato diga otra cosa.</li>
          <li>Las papeletas, el impuesto vehicular y cualquier deuda anterior a la venta son responsabilidad del vendedor y pueden descontarse del precio.</li>
        </ul>
      </S>

      <S id="vendedor" n={7} t="Declaraciones del vendedor">
        <p>Al vendernos tu auto declaras y garantizas que:</p>
        <ul>
          <li>Eres el propietario o tienes poder suficiente inscrito o con firma legalizada.</li>
          <li>El vehículo es de procedencia lícita y no tiene cargas, embargos, órdenes de captura ni litigios distintos a los que informaste.</li>
          <li>No has adulterado el kilometraje, los números de serie o motor, ni ocultado siniestros o fallas relevantes que conozcas.</li>
        </ul>
        <p>Respondes por saneamiento por evicción y por vicios ocultos conforme al Código Civil. Si alguna declaración resulta falsa, AutoPago puede resolver la compra y reclamar la devolución de lo pagado más los daños y perjuicios.</p>
      </S>

      <S id="consigna" n={8} t="Consignación">
        <ul>
          <li>El precio de venta, el plazo y la comisión se definen en un contrato de consignación. La comisión referencial es de {cfg?.commission ?? 5}% sobre el precio final de venta, y solo se cobra si el auto se vende.</li>
          <li>AutoPago no garantiza vender el auto en un plazo ni a un precio determinados.</li>
          <li>Las condiciones de custodia, seguro, exhibición y retiro del vehículo se establecen en el contrato.</li>
        </ul>
      </S>

      <S id="prestamos" n={9} t="Préstamos con garantía">
        <ul>
          <li>Las cuotas y tasas que muestra el simulador, como la TEA desde {cfg?.baseTEA ?? 26}%, son referenciales. La aprobación, el monto, la tasa, la TCEA y el cronograma se informan en el contrato después de evaluar al solicitante y al vehículo.</li>
          <li>El préstamo se garantiza con el vehículo mediante una garantía mobiliaria constituida e inscrita conforme al Decreto Legislativo N.° 1400. Las condiciones de custodia y ejecución ante incumplimiento se pactan en el contrato.</li>
          <li>AutoPago no es una entidad del sistema financiero supervisada por la SBS y no capta depósitos del público. Las tasas que aplica se sujetan a los límites que fije el Banco Central de Reserva del Perú.</li>
        </ul>
      </S>

      <S id="seminuevos" n={10} t="Venta de seminuevos">
        <ul>
          <li>Los precios, fotos y características publicados son referenciales y están sujetos a disponibilidad. La venta se perfecciona con la firma del contrato y el pago.</li>
          <li>Te recomendamos revisar el auto antes de comprarlo. Informaremos por escrito el estado y las condiciones del vehículo, y respondemos conforme al Código de Protección y Defensa del Consumidor.</li>
        </ul>
      </S>

      <S id="revendedores" n={11} t="Portal de revendedores">
        <ul>
          <li>El acceso requiere registro y aprobación de AutoPago, que puede otorgarla, negarla o retirarla sin necesidad de dar explicación.</li>
          <li>La cuenta es personal. Eres responsable de lo que se haga con ella y debes mantener tu contraseña en reserva.</li>
          <li>Los precios mayoristas y la información del portal son confidenciales y no pueden publicarse ni compartirse con terceros.</li>
          <li>Cada oferta que registras es firme y vinculante para ti durante 48 horas o hasta el cierre indicado en el auto. AutoPago es libre de aceptar o rechazar cualquier oferta. La venta se concreta solo con contrato firmado y pago.</li>
        </ul>
      </S>

      <S id="uso" n={12} t="Uso permitido">
        <p>No está permitido usar la web para fines ilícitos, suplantar a otra persona, ingresar datos falsos, extraer información de forma automatizada, interferir con su funcionamiento ni acceder a áreas restringidas sin autorización. Podemos bloquear el acceso a quien incumpla estas reglas.</p>
      </S>

      <S id="comunicaciones" n={13} t="Comunicaciones">
        <p>Al enviarnos una solicitud autorizas que te contactemos por WhatsApp, llamada o correo para atenderla. Las conversaciones por WhatsApp son informativas: ningún acuerdo es vinculante hasta que conste en un contrato firmado.</p>
      </S>

      <S id="pi" n={14} t="Propiedad intelectual">
        <p>La marca AutoPago, el diseño, los textos, el software, los modelos de tasación y las bases de datos de la web son de AutoPago o de sus licenciantes. No pueden copiarse ni usarse sin autorización escrita.</p>
      </S>

      <S id="responsabilidad" n={15} t="Responsabilidad">
        <p>Hacemos lo posible por que la información de la web sea correcta y esté disponible, pero puede contener errores o tener interrupciones. AutoPago no responde por decisiones tomadas solo con base en pre-ofertas, simulaciones o información referencial, ni por daños indirectos o lucro cesante derivados del uso de la web.</p>
        <p>Nada de lo anterior limita los derechos que te reconoce el Código de Protección y Defensa del Consumidor, ni la responsabilidad de AutoPago por dolo o culpa inexcusable.</p>
      </S>

      <S id="reclamos" n={16} t="Reclamos">
        <p>Si tienes un reclamo o una queja, escríbenos a <a href={`mailto:${LEGAL.emailLegal}`}>{LEGAL.emailLegal}</a>. Tienes derecho a registrarlo en nuestro Libro de Reclamaciones, conforme al Código de Protección y Defensa del Consumidor, y te responderemos en el plazo legal.</p>
      </S>

      <S id="cambios" n={17} t="Cambios">
        <p>Podemos actualizar estos términos. La versión vigente es siempre la publicada en esta página, con su fecha. Los cambios no afectan las operaciones ya formalizadas por contrato.</p>
      </S>

      <S id="ley" n={18} t="Ley aplicable">
        <p>Estos términos se rigen por las leyes del Perú. Cualquier controversia se somete a los jueces y tribunales del Distrito Judicial de Lima, sin perjuicio de los derechos que la ley reconoce a los consumidores.</p>
      </S>
    </LegalLayout>
  )
}

const P_SECTIONS = [
  ['responsable', 'Responsable'],
  ['datos', 'Datos que tratamos'],
  ['finalidades', 'Para qué los usamos'],
  ['consentimiento', 'Consentimiento'],
  ['terceros', 'Con quién los compartimos'],
  ['internacional', 'Transferencia internacional'],
  ['conservacion', 'Cuánto tiempo los guardamos'],
  ['seguridad', 'Seguridad'],
  ['derechos', 'Tus derechos'],
  ['cookies', 'Cookies y medición'],
  ['menores', 'Menores de edad'],
  ['cambios', 'Cambios'],
  ['autoridad', 'Autoridad'],
]

export function Privacidad({ cfg }) {
  return (
    <LegalLayout
      cfg={cfg}
      title="Política de privacidad"
      kicker="Datos personales"
      intro="Qué datos pedimos, para qué y cómo los protegemos, conforme a la Ley N.° 29733 de Protección de Datos Personales y su Reglamento."
      sections={P_SECTIONS}
    >
      <Note icon="lock">
        <b>En corto.</b> Pedimos solo lo necesario para cotizar y comprar tu auto, lo guardamos en sistemas con acceso restringido y nunca vendemos tus datos. Puedes pedir que los borremos cuando quieras.
      </Note>

      <S id="responsable" n={1} t="Responsable">
        <p>
          El responsable del tratamiento es {titular()}, con domicilio en {LEGAL.domicilio}. Para cualquier consulta sobre tus datos escribe a <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>.
        </p>
        <p>Tus datos se incorporan a nuestros bancos de datos de clientes, prospectos y revendedores, gestionados conforme a la Ley N.° 29733 y su Reglamento, aprobado por el Decreto Supremo N.° 016-2024-JUS.</p>
      </S>

      <S id="datos" n={2} t="Datos que tratamos">
        <div className="legal-table">
          <div className="lt-row lt-head">
            <span>Cuándo</span>
            <span>Qué datos</span>
          </div>
          <div className="lt-row">
            <span>Tasador y precio congelado</span>
            <span>Nombre, celular, marca, modelo, año, kilometraje y estado del vehículo, y la pre-oferta generada.</span>
          </div>
          <div className="lt-row">
            <span>Consignación y préstamos</span>
            <span>Nombre, celular, vehículo, monto y plazo solicitados. Para formalizar: DNI y documentos del vehículo.</span>
          </div>
          <div className="lt-row">
            <span>Compra o venta formalizada</span>
            <span>Datos de identidad, domicilio, cuenta bancaria para el pago y documentos del vehículo, incluida la información registral de SUNARP.</span>
          </div>
          <div className="lt-row">
            <span>Portal de revendedores</span>
            <span>Nombre, correo, celular, empresa, ofertas registradas y datos de acceso. La contraseña se guarda cifrada y nadie de AutoPago puede verla.</span>
          </div>
          <div className="lt-row">
            <span>Uso de la web</span>
            <span>Pasos del tasador completados, asociados a un identificador aleatorio de sesión que no te identifica por nombre.</span>
          </div>
        </div>
        <p>No pedimos datos sensibles ni datos de tarjetas en la web.</p>
      </S>

      <S id="finalidades" n={3} t="Para qué los usamos">
        <p><b>Finalidades necesarias</b>, sin las cuales no podemos atenderte:</p>
        <ul>
          <li>Calcular tu pre-oferta, congelar el precio y contactarte por WhatsApp, llamada o correo para darte la oferta final.</li>
          <li>Coordinar la revisión del vehículo, verificar su situación legal y preparar y ejecutar los contratos.</li>
          <li>Gestionar el portal de revendedores y las ofertas registradas.</li>
          <li>Cumplir obligaciones legales, tributarias y registrales, y atender requerimientos de autoridades.</li>
          <li>Prevenir fraudes y proteger la seguridad de la web.</li>
          <li>Elaborar estadísticas internas para mejorar el servicio.</li>
        </ul>
        <p><b>Finalidad adicional</b>, solo si la aceptas: enviarte por WhatsApp o correo ofertas, novedades y autos que podrían interesarte. Puedes retirar tu consentimiento cuando quieras escribiendo «BAJA» por WhatsApp o a {LEGAL.emailPrivacidad}.</p>
      </S>

      <S id="consentimiento" n={4} t="Consentimiento">
        <p>Antes de enviarnos tus datos te pedimos que marques una casilla aceptando esta política. Con ello otorgas tu consentimiento libre, previo, expreso, informado e inequívoco para las finalidades necesarias. Puedes revocarlo en cualquier momento, sin efecto retroactivo. Si lo haces, no podremos seguir atendiendo tu solicitud.</p>
      </S>

      <S id="terceros" n={5} t="Con quién los compartimos">
        <p>No vendemos ni alquilamos tus datos. Solo los compartimos con:</p>
        <ul>
          <li><b>Proveedores tecnológicos</b> que actúan como encargados del tratamiento: Supabase (base de datos y autenticación), Vercel (alojamiento de la web), Make (automatización de avisos internos) y Meta (WhatsApp, para comunicarnos contigo).</li>
          <li><b>Notarías, SUNARP, peritos y talleres</b>, cuando es necesario para formalizar una operación.</li>
          <li><b>Entidades financieras o acreedores</b> de tu vehículo, solo para cancelar una deuda inscrita como parte de la compra.</li>
          <li><b>Autoridades competentes</b>, cuando la ley lo exige.</li>
        </ul>
      </S>

      <S id="internacional" n={6} t="Transferencia internacional">
        <p>Algunos proveedores tecnológicos almacenan o procesan datos fuera del Perú, principalmente en Estados Unidos. Solo trabajamos con proveedores que ofrecen garantías adecuadas de seguridad y confidencialidad. Al aceptar esta política autorizas esa transferencia para las finalidades descritas.</p>
      </S>

      <S id="conservacion" n={7} t="Cuánto tiempo los guardamos">
        <ul>
          <li><b>Solicitudes que no se concretan:</b> hasta 2 años desde el último contacto.</li>
          <li><b>Operaciones formalizadas:</b> el tiempo que exigen las normas tributarias, contables y civiles aplicables.</li>
          <li><b>Cuentas de revendedores:</b> mientras la cuenta esté activa y hasta 1 año después.</li>
          <li><b>Datos de uso de la web:</b> hasta 12 meses.</li>
        </ul>
        <p>Vencidos esos plazos, eliminamos o anonimizamos los datos.</p>
      </S>

      <S id="seguridad" n={8} t="Seguridad">
        <p>Usamos conexiones cifradas (HTTPS), control de acceso por roles y reglas de seguridad en la base de datos. Solo personal autorizado accede a la información de clientes. Ningún sistema es infalible: si detectamos un incidente que afecte tus datos, te informaremos y actuaremos conforme a la ley.</p>
      </S>

      <S id="derechos" n={9} t="Tus derechos">
        <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación, oposición y los demás que reconoce la ley. Escribe a <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a> indicando tu nombre, una copia de tu documento de identidad y lo que solicitas. Responderemos dentro de los plazos que establece la normativa.</p>
      </S>

      <S id="cookies" n={10} t="Cookies y medición">
        <p>Hoy la web no usa cookies publicitarias. Usamos almacenamiento técnico del navegador para mantener tu sesión y un identificador aleatorio para medir en qué paso del tasador se abandona el proceso. Si en el futuro incorporamos herramientas como Google Analytics o Meta Pixel, actualizaremos esta política antes de activarlas.</p>
      </S>

      <S id="menores" n={11} t="Menores de edad">
        <p>Nuestros servicios no están dirigidos a menores de 18 años. Si detectamos datos de un menor, los eliminaremos.</p>
      </S>

      <S id="cambios" n={12} t="Cambios">
        <p>Podemos actualizar esta política. Publicaremos la nueva versión con su fecha y, si el cambio es importante, te lo informaremos por los medios de contacto que nos diste.</p>
      </S>

      <S id="autoridad" n={13} t="Autoridad">
        <p>Si consideras que no atendimos bien tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.</p>
      </S>
    </LegalLayout>
  )
}
