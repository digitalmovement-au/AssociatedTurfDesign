
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const root = document.documentElement;
const motion = root.classList.contains("js-motion");
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/* ───────────── Smooth scroll ───────────── */
/* Native scrolling (no smooth-scroll library): follows the wheel and finger exactly. */
const lenis: { stop(): void; start(): void; scrollTo(t: number | HTMLElement, o?: object): void } | null = null;
const headerOffset = () => -(($("[data-header]")?.offsetHeight ?? 80) + 16);
const scrollToEl = (el: Element) => {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: headerOffset(), duration: 1.15 });
  else window.scrollTo({ top: (el as HTMLElement).getBoundingClientRect().top + window.scrollY + headerOffset(), behavior: motion ? "smooth" : "auto" });
};

/* ───────────── Header, menu, progress ───────────── */
const header = $("[data-header]");
const burger = $<HTMLButtonElement>("[data-burger]");
const mnav = $("[data-mnav]");
const totop = $("[data-totop]");
const mbar = $("[data-mbar]");
let lastY = window.scrollY;

const setMenu = (open: boolean) => {
  if (!burger || !mnav) return;
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  if (open) {
    root.classList.remove("hdr-hidden");
    const bottom = header?.getBoundingClientRect().bottom ?? 72;
    mnav.style.top = `${Math.max(header?.offsetHeight ?? 72, bottom)}px`;
  }
  mnav.hidden = !open;
  root.classList.toggle("menu-open", open);
  if (open) { lenis?.stop(); mnav.scrollTop = 0; } else lenis?.start();
};
burger?.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
mnav?.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mnav && !mnav.hidden) { setMenu(false); burger?.focus(); } });
matchMedia("(min-width: 1181px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

const stepsEls = $$("[data-steps]");

const frame = () => {
  const y = window.scrollY;
  const vh = window.innerHeight;
  const max = Math.max(1, document.documentElement.scrollHeight - vh);
  const p = Math.min(1, Math.max(0, y / max));
  const menuOpen = !!mnav && !mnav.hidden;

  root.classList.toggle("hdr-solid", y > 40);
  if (!menuOpen) {
    if (y > 520 && y > lastY + 6) root.classList.add("hdr-hidden");
    else if (y < lastY - 6 || y < 200) root.classList.remove("hdr-hidden");
  }
  lastY = y;

  if (totop) {
    totop.classList.toggle("is-on", y > 700);
    totop.style.setProperty("--p", p.toFixed(4));
  }
  for (const s of stepsEls) {
    const r = s.getBoundingClientRect();
    const sp = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height * 0.75)));
    s.style.setProperty("--sp", (motion ? sp : 1).toFixed(3));
    $$("li", s).forEach((li, i, arr) => li.classList.toggle("is-done", !motion || sp >= (i + 0.35) / arr.length));
  }
};
let ticking = false;
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); } };
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
frame();

/* ───────────── "#quote" routing ───────────── */
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (href === "#quote") {
    e.preventDefault();
    const pick = a.dataset.pick;
    const target = $("#quote") ?? null;
    if (!target) { window.location.href = `${BASE}/turf-quote/`; return; }
    if (pick) $$<HTMLSelectElement>("[data-variety]", target).forEach((s) => { s.value = pick; });
    scrollToEl(target);
    return;
  }
  if (href === "#top") { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 1.2 }) : window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" }); return; }
  if (href.startsWith("#") && href.length > 1) {
    const t = document.getElementById(href.slice(1));
    if (t) { e.preventDefault(); scrollToEl(t); }
  }
});

/* Hide the mobile action bar while a quote form is on screen. */
if (mbar && "IntersectionObserver" in window) {
  const seen = new Set<Element>();
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
    root.classList.toggle("mbar-hidden", seen.size > 0);
  }, { threshold: 0.15 });
  $$("[data-quote-form], .ftr").forEach((f) => io.observe(f));
}

/* ───────────── Reveals ───────────── */
const mows = $$("[data-mow]");
const fades = $$("[data-fade]");
if (!motion || !("IntersectionObserver" in window)) {
  mows.forEach((m) => m.classList.add("is-cut"));
  fades.forEach((f) => f.classList.add("is-in"));
} else {
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add(en.target.hasAttribute("data-mow") ? "is-cut" : "is-in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  mows.forEach((m) => {
    const im = $<HTMLImageElement>("img", m);
    const go = () => io.observe(m);
    // Wait for the photo so the stripes peel back onto a loaded image (fallback after 1.2s).
    if (!im || im.complete) go();
    else { im.addEventListener("load", go, { once: true }); im.addEventListener("error", go, { once: true }); setTimeout(go, 1200); }
  });
  fades.forEach((f) => io.observe(f));
}

/* Count up stats once visible. */
const counters = $$<HTMLElement>("[data-count]");
if (counters.length && motion && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement;
      const end = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      };
      el.textContent = "0";
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
}

/* ───────────── Turf selector tabs ───────────── */
$$("[data-selector]").forEach((sel) => {
  const tabs = $$<HTMLButtonElement>("[data-sel-tab]", sel);
  const panels = $$("[data-sel-panel]", sel);
  const show = (i: number, focus = false) => {
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => (p.hidden = k !== i));
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => show(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); show((i + 1) % tabs.length, true); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
});

/* ───────────── Turf calculator ───────────── */
$$("[data-calc]").forEach((calc) => {
  const rows = $("[data-calc-rows]", calc)!;
  const totalEl = $("[data-calc-total]", calc)!;
  const extra = $<HTMLInputElement>("[data-calc-extra]", calc)!;
  const num = (v: string) => Math.max(0, parseFloat(v.replace(",", ".")) || 0);
  const total = () => {
    const sum = $$("[data-calc-row]", rows).reduce((s, r) => s + num($<HTMLInputElement>("[data-l]", r)!.value) * num($<HTMLInputElement>("[data-w]", r)!.value), 0);
    return Math.ceil(sum * (extra.checked ? 1.05 : 1));
  };
  const update = () => { totalEl.textContent = String(total()); };
  calc.addEventListener("input", update);
  $("[data-calc-add]", calc)?.addEventListener("click", () => {
    const first = $("[data-calc-row]", rows)!;
    const row = first.cloneNode(true) as HTMLElement;
    $$<HTMLInputElement>("input", row).forEach((i) => (i.value = ""));
    rows.appendChild(row);
    $<HTMLInputElement>("input", row)?.focus();
  });
  $("[data-calc-use]", calc)?.addEventListener("click", () => {
    const t = total();
    const form = calc.closest("section")?.querySelector<HTMLFormElement>("[data-quote-form]");
    if (!form) return;
    const area = $<HTMLInputElement>("[data-area]", form);
    if (area && t > 0) area.value = String(t);
    const msg = $<HTMLTextAreaElement>("[data-msg]", form);
    const parts = $$("[data-calc-row]", rows).map((r) => [$<HTMLInputElement>("[data-l]", r)!.value, $<HTMLInputElement>("[data-w]", r)!.value]).filter(([l, w]) => num(l) && num(w)).map(([l, w]) => `${l} m x ${w} m`);
    if (msg && parts.length) msg.value = `Areas: ${parts.join(", ")}${extra.checked ? " (+5% allowance)" : ""}. ${msg.value}`.trim();
    scrollToEl(form);
    setTimeout(() => $<HTMLInputElement>("input[name=name]", form)?.focus({ preventScroll: true }), 900);
  });
});

/* ───────────── Lightbox ───────────── */
const links = $$<HTMLAnchorElement>("a[data-lightbox]");
if (links.length) {
  const dlg = document.createElement("dialog");
  dlg.className = "lb";
  dlg.innerHTML = `<form method="dialog"><button class="lb__x" aria-label="Close">&times;</button></form><button class="lb__nav lb__prev" aria-label="Previous photo">&#8249;</button><img alt="" /><button class="lb__nav lb__next" aria-label="Next photo">&#8250;</button>`;
  document.body.appendChild(dlg);
  const im = $<HTMLImageElement>("img", dlg)!;
  let idx = 0;
  const show = (i: number) => { idx = (i + links.length) % links.length; im.src = links[idx].href; im.alt = $("img", links[idx])?.getAttribute("alt") ?? ""; };
  links.forEach((a, i) => a.addEventListener("click", (e) => { e.preventDefault(); show(i); dlg.showModal(); lenis?.stop(); }));
  $(".lb__prev", dlg)!.addEventListener("click", () => show(idx - 1));
  $(".lb__next", dlg)!.addEventListener("click", () => show(idx + 1));
  dlg.addEventListener("close", () => lenis?.start());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") show(idx + 1); if (e.key === "ArrowLeft") show(idx - 1); });
}

/* ───────────── Quote forms ───────────── */
$$<HTMLFormElement>("[data-quote-form]").forEach((form) => {
  const status = $(".qf__status", form)!;
  const setErr = (input: HTMLInputElement, msg: string) => {
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    input.closest(".field")?.classList.toggle("invalid", !!msg);
    const e = input.parentElement?.querySelector(".err");
    if (e) e.textContent = msg;
  };
  $$<HTMLInputElement>("input[required]", form).forEach((i) => i.addEventListener("input", () => setErr(i, "")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let ok = true;
    const name = form.elements.namedItem("name") as HTMLInputElement;
    const email = form.elements.namedItem("email") as HTMLInputElement;
    const phone = form.elements.namedItem("phone") as HTMLInputElement;
    if (!name.value.trim()) { setErr(name, "Enter your name"); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(email.value)) { setErr(email, "Enter an email we can reply to"); ok = false; }
    if (phone.value.replace(/\D/g, "").length < 8) { setErr(phone, "Enter a phone number with at least 8 digits"); ok = false; }
    if (!ok) { $<HTMLInputElement>("[aria-invalid=true]", form)?.focus(); return; }
    const btn = $<HTMLButtonElement>("button[type=submit]", form)!;
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    status.className = "qf__status"; status.textContent = "";
    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;
    try {
      const res = endpoint
        ? await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        : await fetch(`${BASE}/`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data as unknown as Record<string, string>).toString() });
      if (!res.ok) throw new Error(String(res.status));
      (window as unknown as { dataLayer?: object[] }).dataLayer?.push({ event: "quote_submitted" });
      window.location.href = `${BASE}/thank-you/`;
    } catch {
      status.classList.add("bad");
      status.textContent = "Your request didn’t send. Check your connection and try again, or call 1800 044 006.";
      btn.disabled = false; btn.textContent = label;
    }
  });
});

/* ───────────── Home scroll story ───────────── */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const scrubs = $$("[data-scrub]");
const collages = $$("[data-collage]");
const tileSeed = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
$$("[data-words]").forEach((s) => $$("[data-w]", s).forEach((w, i) => w.style.setProperty("--i", String(i))));
/* Tiles assemble over a fixed time once in view (no scroll pinning). */
const playTiles = (s: HTMLElement) => {
  const grid = $(".tl", s)!;
  const tiles = $$("[data-tile]", s);
  const frame = (p: number) => {
    tiles.forEach((t, i) => {
      const d = tileSeed(i, 1) * 0.3;
      const e = ease(clamp01((p * 0.9 + 0.12 - d) / 0.45));
      const dx = (tileSeed(i, 2) - 0.5) * 70, dy = (tileSeed(i, 3) - 0.5) * 60 + 30, rot = (tileSeed(i, 4) - 0.5) * 40;
      t.style.transform = e >= 1 ? "" : `translate(${dx * (1 - e)}vw, ${dy * (1 - e)}vh) rotate(${rot * (1 - e)}deg)`;
      t.style.opacity = String(Math.min(1, e * 1.6));
    });
    grid.classList.toggle("is-whole", p > 0.88);
    grid.style.setProperty("--cap", clamp01((p - 0.88) / 0.1).toFixed(3));
  };
  if (!motion) return frame(1);
  frame(0);
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1600;
    const tick = (now: number) => { const p = clamp01((now - t0) / dur); frame(p); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, { threshold: 0.35 });
  io.observe(s);
};

/* Words reveal as a quick staggered fade once in view. */
const playWords = (s: HTMLElement) => {
  const show = () => {
    $$("[data-w]", s).forEach((w) => w.classList.add("on"));
    s.style.setProperty("--ul", "1");
    $("[data-chips]", s)?.classList.add("on");
    s.style.setProperty("--tail", "1");
  };
  if (!motion) return show();
  s.style.setProperty("--ul", "0");
  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); show(); } }, { threshold: 0.3 });
  io.observe(s);
};

/* Features: auto-advance while in view; click or Enter to pick one. */
const playFeats = (s: HTMLElement) => {
  const items = $$("[data-feat]", s);
  const imgs = $$("[data-feat-img]", s);
  let k = 0, timer = 0, visible = false;
  const set = (n: number) => {
    k = (n + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle("is-on", i === k));
    imgs.forEach((im, i) => im.classList.toggle("is-on", i === k));
    s.style.setProperty("--fp", ((k + 1) / items.length).toFixed(3));
  };
  const run = () => { clearInterval(timer); if (visible && motion) timer = window.setInterval(() => set(k + 1), 4500); };
  items.forEach((it, i) => {
    it.addEventListener("click", () => { set(i); run(); });
    it.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set(i); run(); } });
  });
  set(0);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }, { threshold: 0.3 }).observe(s);
};

if ("IntersectionObserver" in window) {
  scrubs.forEach((s) => {
    if (s.hasAttribute("data-words")) playWords(s);
    if (s.hasAttribute("data-tiles")) playTiles(s);
    if (s.hasAttribute("data-feats")) playFeats(s);
  });
}

const collageFrame = () => {
  const vh = window.innerHeight;
  for (const c of collages) {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--cp", (motion ? ease(clamp01((vh - r.top) / (vh * 0.9))) : 1).toFixed(3));
  }
};
if (collages.length) {
  let queued = false;
  const q = () => { if (!queued) { queued = true; requestAnimationFrame(() => { collageFrame(); queued = false; }); } };
  window.addEventListener("scroll", q, { passive: true });
  window.addEventListener("resize", q);
  collageFrame();
}

/* Sun / shade switch */
$$("[data-sunshade]").forEach((sec) => {
  const btn = $<HTMLButtonElement>("[data-sunshade-btn]", sec)!;
  const set = (shade: boolean) => {
    btn.setAttribute("aria-checked", String(shade));
    $("[data-sunshade-state]", sec)!.textContent = shade ? "On" : "Off";
    sec.classList.toggle("is-shade", shade);
    $$("[data-sunshade-img]", sec).forEach((im) => im.classList.toggle("is-on", (im.dataset.sunshadeImg === "shade") === shade));
    $$("[data-panel]", sec).forEach((p) => (p.hidden = (p.dataset.panel === "shade") !== shade));
  };
  btn.addEventListener("click", () => set(btn.getAttribute("aria-checked") !== "true"));
});

/* ───────────── Growing grass: none on load, grows evenly with page scroll (one composited transform) ───────────── */
const grassGrow = $<HTMLElement>("[data-grass-grow]");
if (grassGrow) {
  const wrap = grassGrow.parentElement!;
  let q = false;
  const grow = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const g = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    grassGrow.style.transform = `scaleY(${g.toFixed(3)})`;
    wrap.classList.toggle("is-empty", g <= 0.001);
    q = false;
  };
  window.addEventListener("scroll", () => { if (!q) { q = true; requestAnimationFrame(grow); } }, { passive: true });
  window.addEventListener("resize", grow);
  grow();
}
