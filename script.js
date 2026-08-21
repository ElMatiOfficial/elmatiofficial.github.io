const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// stats: counters that converge like estimators (value + shrinking ± interval)
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const comma = el.dataset.format === "comma";
  const fmt = (n) => prefix + (comma ? n.toLocaleString("en-US") : n) + suffix;
  if (reduceMotion) { el.textContent = fmt(target); return; }
  el.textContent = "";
  const val = document.createElement("span");
  const ci = document.createElement("span");
  ci.className = "stat-ci";
  ci.setAttribute("aria-hidden", "true");
  el.append(val, ci);
  const ci0 = Math.max(2, Math.round(target * 0.2));
  const dur = 1100;
  const t0 = performance.now();
  function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    val.textContent = fmt(Math.round(target * eased));
    const c = Math.round(ci0 * (1 - eased));
    if (c > 0) {
      ci.textContent = "±" + (comma ? c.toLocaleString("en-US") : c);
    } else if (!ci.classList.contains("gone")) {
      ci.classList.add("gone");
      ci.addEventListener("transitionend", () => { ci.remove(); }, { once: true });
    }
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

// plotter draft: the hero diagram inks itself, then the pulses switch on
(function initPlotter() {
  const svg = document.querySelector(".diagram-svg");
  if (!svg || reduceMotion) return;
  svg.classList.add("draw");
  svg.querySelectorAll(".wire").forEach((p) => {
    p.style.setProperty("--len", p.getTotalLength());
  });
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add("drawn")));
})();

// percentile split-flap: board results flip to "top X%" on hover/focus
let refreshFlaps = () => {};
(function initSplitFlap() {
  if (reduceMotion || window.matchMedia("(hover: none)").matches) return;
  const flaps = [];
  document.querySelectorAll(".board-row .b-res").forEach((el) => {
    const m = el.textContent.trim().match(/^([\d,]+)\s*\/\s*([\d,]+)$/);
    if (!m) return;
    const rank = parseInt(m[1].replace(/,/g, ""), 10);
    const total = parseInt(m[2].replace(/,/g, ""), 10);
    const pct = (rank / total) * 100;
    const flip = document.createElement("span");
    flip.className = "flip";
    const a = document.createElement("span");
    a.className = "flip-a";
    a.textContent = m[0];
    const b = document.createElement("span");
    b.className = "flip-b";
    b.setAttribute("aria-hidden", "true");
    flaps.push([b, pct]);
    flip.append(a, b);
    el.textContent = "";
    el.append(flip);
  });
  refreshFlaps = () => {
    const loc = document.documentElement.lang || "en";
    for (const [b, pct] of flaps) {
      b.textContent = "top " + (pct < 10
        ? pct.toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : Math.round(pct)) + "%";
    }
  };
  refreshFlaps();
})();

// career ledger: the timeline rule inks downward, tracking reading position
let refreshLedger = () => {};
(function initLedger() {
  const timeline = document.querySelector(".timeline");
  if (!timeline || reduceMotion) return;
  let ticking = false;
  function update() {
    ticking = false;
    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.65 - r.top) / r.height));
    timeline.style.setProperty("--tl-progress", p.toFixed(4));
  }
  function schedule() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  refreshLedger = schedule;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  update();
})();

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
  refreshLedger();
  refreshFlaps();
}

const langSwitch = document.getElementById("langSwitch");
if (langSwitch) {
  langSwitch.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".lang-btn");
    if (btn) {
      const tag = document.querySelector(".hero-tagline");
      if (tag) tag.classList.add("ruled");
      applyLang(btn.dataset.lang);
    }
  });
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  if (saved && saved !== "en") applyLang(saved);
}
