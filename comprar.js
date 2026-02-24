(() => {
  const WHATSAPP_NUMBER = "51988886970";
  const BRAND = "AutoPago";
  const waUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const yearNow = document.getElementById("yearNow");
  if (yearNow) yearNow.textContent = new Date().getFullYear();

  const cars = [
    { id:"mg-zx-plus-2024", type:"SUV", title:"MG ZX PLUS", subtitle:"1.5L CVT SPORT CON GLP", year:2024, price:15990, km:7400, fuel:"Gas GLP", trans:"CVT",
      img:"https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=70" },
    { id:"kia-rio-hb-2017", type:"Hatchback", title:"KIA RIO HB", subtitle:"1.4 AT LX PLUS", year:2017, price:11990, km:72880, fuel:"Gasolina", trans:"AT",
      img:"https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=70" },
    { id:"mercedes-glc-43-2018", type:"SUV", title:"MERCEDES‑BENZ SERIE AMG", subtitle:"GLC 43 4MATIC", year:2018, price:42990, km:41400, fuel:"Gasolina", trans:"AT",
      img:"https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1600&q=70" }
  ];

  const fmtUSD = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
  const container = document.getElementById("showroom");
  const baseUrl = window.location.origin;

  container.innerHTML = cars.map(c => {
    const link = `${baseUrl}/comprar.html#${c.id}`;
    return `
      <article class="carCard" id="${c.id}">
        <div class="carImg"><img src="${c.img}" alt="${c.title} ${c.subtitle} ${c.year}"></div>
        <div class="carBody">
          <span class="tag">${c.type}</span>
          <div class="carTop" style="margin-top:10px">
            <div>
              <h3 class="carTitle">${c.title}</h3>
              <div class="carMeta">${c.subtitle} · ${c.year}</div>
            </div>
            <div class="price">${fmtUSD(c.price)}</div>
          </div>
        </div>
        <div class="carFooter">
          <div class="small">🚘 ${c.km.toLocaleString("en-US")} km · ⛽ ${c.fuel} · ⚙️ ${c.trans}</div>
          <button class="btn btn--primary interestBtn" data-link="${link}" data-name="${c.title} ${c.subtitle} ${c.year}" type="button">Me interesa</button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".interestBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const link = btn.dataset.link;
      const msg = `Hola ${BRAND}. Estoy interesado en ${name}.

Link: ${link}`;
      window.open(waUrl(msg), "_blank", "noopener,noreferrer");
    });
  });

  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) navToggle.addEventListener("click", () => navMobile.classList.toggle("is-open"));
})();