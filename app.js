(() => {
  const WHATSAPP_NUMBER = "51988886970";
  const BRAND = "AutoPago";

  const $ = (sel) => document.querySelector(sel);

  const navToggle = $("#navToggle");
  const navMobile = $("#navMobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => navMobile.classList.toggle("is-open"));
    navMobile.querySelectorAll("a").forEach(a => a.addEventListener("click", () => navMobile.classList.remove("is-open")));
  }

  $("#yearNow").textContent = new Date().getFullYear();

  const yearSelect = document.querySelector('select[name="year"]');
  if (yearSelect) {
    const now = new Date().getFullYear();
    for (let y = now; y >= 1995; y--) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
  }

  const fmtUSD = (n) => {
    if (!Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  };
  const waUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  // Placeholder fallback (sin data real de comparables).
  const estimateMarketFallback = ({ year, km }) => {
    const y = Number(year);
    const k = Number(km);
    const age = Math.max(0, new Date().getFullYear() - y);
    let base = 18000 - (age * 900);
    base -= Math.max(0, (k - 40000)) * 0.03;
    base = Math.min(45000, Math.max(3500, base));
    return Math.round(base / 50) * 50;
  };

  const getFormData = (form) => {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.km = data.km ? Number(data.km) : null;
    data.publishedUsd = data.publishedUsd ? Number(data.publishedUsd) : null;
    return data;
  };

  const getMarketValue = (data) => {
    // Proxy a "comparables": el precio publicado del usuario (si existe).
    if (data.publishedUsd && data.publishedUsd > 0) return data.publishedUsd;
    if (data.year && Number.isFinite(data.km)) return estimateMarketFallback({ year: data.year, km: data.km });
    return null;
  };

  const offerRange = (market) => ({ low: market - 3000, high: market - 2000 });

  const renderResults = (market) => {
    const { low, high } = offerRange(market);
    $("#rMarket").textContent = fmtUSD(market);
    $("#rOfferLow").textContent = fmtUSD(low);
    $("#rOfferHigh").textContent = fmtUSD(high);
    $("#rFee3").textContent = fmtUSD(market * 0.03);
    $("#rFee5").textContent = fmtUSD(market * 0.05);
  };

  const quoteForm = $("#quoteForm");
  if (quoteForm) {
    const update = () => {
      const data = getFormData(quoteForm);
      const market = getMarketValue(data);
      if (market && Number.isFinite(market)) renderResults(market);
    };

    quoteForm.addEventListener("input", update);
    quoteForm.addEventListener("change", update);

    quoteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = getFormData(quoteForm);
      const market = getMarketValue(data);
      const rng = market ? offerRange(market) : null;

      // Guardar lead en backend (para /admin)
      try {
        await fetch("/.netlify/functions/createLead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            marketUsd: market,
            offerLowUsd: rng?.low ?? null,
            offerHighUsd: rng?.high ?? null,
            source: "web",
            createdAt: new Date().toISOString(),
          }),
        });
      } catch (_) {}

      const msg =
`Hola ${BRAND}, quiero mi pre-oferta y vender rápido.

👤 Contacto
• Nombre: ${data.fullName || "—"}
• WhatsApp: ${data.phone || "—"}

🚗 Vehículo
• Año: ${data.year || "—"}
• Marca/Modelo: ${data.brand || "—"} ${data.model || "—"}
• Transmisión: ${data.transmission || "—"}
• Versión: ${data.version || "—"}
• Km: ${Number.isFinite(data.km) ? data.km.toLocaleString("en-US") : "—"} km

📌 Referencia (si tengo)
• Precio publicado (USD): ${data.publishedUsd ? fmtUSD(data.publishedUsd) : "No indicado"}
• Link anuncio: ${(data.listingUrl || "").trim() || "—"}

🎯 Opción elegida
• ${data.service || "—"}

📊 Pre-oferta (referencial)
• Valor referencia: ${market ? fmtUSD(market) : "Pendiente"}
• Rango ${BRAND}: ${market ? `${fmtUSD(rng.low)} a ${fmtUSD(rng.high)}` : "—"}

📝 Comentarios
${(data.notes || "").trim() || "—"}

¿Coordinamos visita de validación?`;

      window.open(waUrl(msg), "_blank", "noopener,noreferrer");
    });

    $("#btnNoCar").addEventListener("click", () => {
      const msg =
`Hola ${BRAND}. Quiero vender mi auto rápido.

¿Me ayudan con el siguiente paso?
Puedo pasarles:
• Año, marca, modelo, versión
• Km
• Fotos
• Precio publicado (si tengo)`;
      window.open(waUrl(msg), "_blank", "noopener,noreferrer");
    });
  }

  const openWhats = (context) => {
    const msg =
`Hola ${BRAND}. ${context}

Quiero:
1) Compra inmediata (pre-oferta + validación + firma el mismo día), o
2) Concesión 3% / Concesión 5%.`;
    window.open(waUrl(msg), "_blank", "noopener,noreferrer");
  };

  $("#btnWhatsHero")?.addEventListener("click", () => openWhats("Vengo desde autopago.pe."));
  $("#btnWhatsServicios")?.addEventListener("click", () => openWhats("Quiero concesión y entender cuál plan me conviene."));
  $("#btnWhatsFooter")?.addEventListener("click", () => openWhats("Quiero hablar con un asesor."));
  $("#waFloat")?.addEventListener("click", () => openWhats("Hola, necesito vender mi auto rápido."));
})();
