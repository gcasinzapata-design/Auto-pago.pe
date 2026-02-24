(() => {
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  if (navToggle && navMobile) navToggle.addEventListener("click", () => navMobile.classList.toggle("is-open"));
  const y = document.getElementById("yearNow");
  if (y) y.textContent = new Date().getFullYear();
})();