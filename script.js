// nav border on scroll
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// scroll-reveal
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("on");
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// animated counters in the stats bar
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const comma = el.dataset.format === "comma";
  const dur = 1100;
  const t0 = performance.now();
  function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const n = Math.round(target * eased);
    el.textContent = prefix + (comma ? n.toLocaleString("en-US") : n) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const statsIo = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.querySelectorAll(".stat-num").forEach(animateCount);
      statsIo.unobserve(e.target);
    }
  }
}, { threshold: 0.4 });
const stats = document.querySelector(".stats");
if (stats) statsIo.observe(stats);

// language switcher (translations in i18n.js; English lives in the markup)
const enDefaults = {};
document.querySelectorAll("[data-i18n]").forEach((el) => {
  enDefaults[el.dataset.i18n] = el.innerHTML;
});

function applyLang(lang) {
  const dict = lang === "en" ? enDefaults : (typeof I18N !== "undefined" && I18N[lang]) || {};
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const value = dict[key] !== undefined ? dict[key] : enDefaults[key];
    if (el.namespaceURI === "http://www.w3.org/2000/svg") {
      el.textContent = value.replace(/<[^>]*>/g, "");
    } else {
      el.innerHTML = value;
    }
  });
  document.documentElement.lang = lang;
  try { localStorage.setItem("lang", lang); } catch (e) {}
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("on", b.dataset.lang === lang);
  });
}

const langSwitch = document.getElementById("langSwitch");
if (langSwitch) {
  langSwitch.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".lang-btn");
    if (btn) applyLang(btn.dataset.lang);
  });
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  if (saved && saved !== "en") applyLang(saved);
}
