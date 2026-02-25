(() => {
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) navToggle.addEventListener("click", () => navMobile.classList.toggle("is-open"));

  const y = document.getElementById("yearNow");
  if (y) y.textContent = new Date().getFullYear();

  const markActive = () => {
    const path = window.location.pathname.replace(/\/+$/, "");
    const hash = window.location.hash || "";

    const isHome = (path === "" || path === "/" || path.endsWith("/index.html"));
    const isSell = isHome && (hash === "" || hash === "#vender");
    const isBuy = path.endsWith("/comprar.html");
    const isAutometro = path.endsWith("/autometro.html") || path.endsWith("/autometro");
    const isComo = path.endsWith("/como-trabajamos.html") || path.endsWith("/como-trabajamos");

    document.querySelectorAll(".nav a, #navMobile a").forEach(a => a.classList.remove("is-active"));

    const set = (href) => {
      document.querySelectorAll(`.nav a[href="${href}"], #navMobile a[href="${href}"]`).forEach(a => a.classList.add("is-active"));
    };

    if (isSell || isHome) set("/#vender");
    else if (isBuy) set("/comprar.html");
    else if (isAutometro) set("/autometro.html");
    else if (isComo) set("/como-trabajamos.html");
  };

  window.addEventListener("hashchange", markActive);
  markActive();
})();