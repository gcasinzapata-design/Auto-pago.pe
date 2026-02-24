(() => {
  const WHATSAPP_NUMBER = "51988886970";
  const BRAND = "AutoPago";

  const $ = (sel) => document.querySelector(sel);

  // Mobile nav
  const navToggle = $("#navToggle");
  const navMobile = $("#navMobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      navMobile.classList.toggle("is-open");
    });
    navMobile.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => navMobile.classList.remove("is-open"));
    });
  }

  // Footer year
  $("#yearNow").textContent = new Date().getFullYear();

  // Populate years
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

  // Conservative fallback when user doesn't input published price.
  const estimateMarketFallback = ({ year, km }) => {
    const y = Number(year);
    const k = Number(km);
    const age = Math.max(0, new Date().getFullYear() - y);

    let base = 18000 - (age * 900);
    base -= Math.max(0, (k - 40000)) * 0.03;

    base = Math.min(45000, Math.max(3500, base));
    return Math.round(base / 50) * 50;
  };

  const renderResults = (market) => {
    const fast2 = market - 2000;
    const fast3 = market - 3000;
    const fee3 = market * 0.03;
    const fee5 = market * 0.05;

    $("#rMarket").textContent = fmtUSD(market);
    $("#rFast2").textContent = fmtUSD(fast2);
    $("#rFast3").textContent = fmtUSD(fast3);
    $("#rFee3").textContent = fmtUSD(fee3);
    $("#rFee5").textContent = fmtUSD(fee5);
  };

  const getFormData = (form) => {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.km = data.km ? Number(data.km) : null;
    data.publishedUsd = data.publishedUsd ? Number(data.publishedUsd) : null;
    return data;
  };

  const quoteForm = $("#quoteForm");
  if (quoteForm) {
    const update = () => {
      const data = getFormData(quoteForm);
      let market = null;

      if (data.publishedUsd && data.publishedUsd > 0) {
        market = data.publishedUsd;
      } else if (data.year && data.km !== null) {
        market = estimateMarketFallback({ year: data.year, km: data.km });
      }

      if (market && Number.isFinite(market)) renderResults(market);
    };

    quoteForm.addEventListener("input", update);
    quoteForm.addEventListener("change", update);

    quoteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = getFormData(quoteForm);

      const year = data.year || "—";
      const brand = data.brand || "—";
      const model = data.model || "—";
      const transmission = data.transmission || "—";
      const version = data.version || "—";
      const km = Number.isFinite(data.km) ? data.km.toLocaleString("en-US") : "—";
      const plate = (data.plate || "").trim() || "—";
      const service = data.service || "—";
      const notes = (data.notes || "").trim();

      let market = null;
      if (data.publishedUsd && data.publishedUsd > 0) {
        market = data.publishedUsd;
      } else if (data.year && Number.isFinite(data.km)) {
        market = estimateMarketFallback({ year: data.year, km: data.km });
      }

      const fast2 = market ? market - 2000 : null;
      const fast3 = market ? market - 3000 : null;

      const msg =
`Hola ${BRAND}, quiero cotizar mi auto.

📌 Datos del vehículo
• Año: ${year}
• Marca/Modelo: ${brand} ${model}
• Transmisión: ${transmission}
• Versión: ${version}
• Kilometraje: ${km} km
• Placa: ${plate}

🎯 Opción elegida
• ${service}

💸 Referencia
• Precio publicado (USD): ${data.publishedUsd ? fmtUSD(data.publishedUsd) : "No indicado"}

📊 Cotización preliminar (estimada)
• Valor mercado: ${market ? fmtUSD(market) : "Pendiente (necesito asesoría)"}
• Compra rápida (−$2K): ${fast2 ? fmtUSD(fast2) : "—"}
• Compra rápida (−$3K): ${fast3 ? fmtUSD(fast3) : "—"}
• Concesión 3% (fee): ${market ? fmtUSD(market * 0.03) : "—"}
• Concesión 5% (fee): ${market ? fmtUSD(market * 0.05) : "—"}

📝 Comentarios
${notes ? notes : "—"}

¿Me ayudan con el siguiente paso?`;

      window.open(waUrl(msg), "_blank", "noopener,noreferrer");
    });

    $("#btnNoCar").addEventListener("click", () => {
      const msg =
`Hola ${BRAND}. Quiero cotizar manualmente.

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

Quiero asesoría para:
1) Compra rápida (sin comisión, pago en 1 día, −$2K a −$3K), o
2) Concesión 3% / Concesión 5%.`;
    window.open(waUrl(msg), "_blank", "noopener,noreferrer");
  };

  $("#btnWhatsHero")?.addEventListener("click", () => openWhats("Vengo desde autopago.pe."));
  $("#btnWhatsServicios")?.addEventListener("click", () => openWhats("Quiero concesión y entender cuál plan me conviene."));
  $("#btnWhatsFooter")?.addEventListener("click", () => openWhats("Quiero hablar con un asesor."));
  $("#waFloat")?.addEventListener("click", () => openWhats("Hola, necesito ayuda para vender mi auto."));
})();
