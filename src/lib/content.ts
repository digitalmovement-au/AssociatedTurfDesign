/**
 * Build-time parser for the migrated WordPress content in content/raw/*.txt.
 * Each block starts with "=== /path/" followed by header fields (K, S, T, D, OG, DT, H) and body lines in a light
 * markdown dialect: "# h1", "## h2", "- li", "![alt](U/yyyy/mm/file)", "TABLE: a | b" … "END TABLE", plain paragraphs.
 * Suburb pages may use "@Cn" references to shared lines defined once as "@@Cn text" ({S} = suburb name).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Kind = "page" | "suburb" | "post" | "index";
export interface Entry {
  path: string;
  kind: Kind;
  title: string;
  desc: string;
  og: string;
  date?: string;
  h1?: string;
  suburb?: string;
  lines: string[];
}

const RAW = join(process.cwd(), "content/raw");
const LOCATION = "Sydney";

const fixText = (s: string) =>
  s
    .replace(/\{Location\}/g, LOCATION)
    .replace(/\*\*\s\*\*/g, "")
    .replace(/\*{4,}/g, "")
    .replace(/https?:\/\/(?:www\.)?associatedturf\.com\.au(?=\/)/g, "")
    .replace(/https?:\/\/shannynr16\.sg-host\.com\/wp-content\/uploads\//g, "U/")
    .replace(/‎|‪|‬/g, "")
    .trimEnd();

const normImg = (s = "") => s.replace(/^https?:\/\/[^/]+\/wp-content\/uploads\//, "").replace(/^U\//, "").replace(/^\/wp-content\/uploads\//, "");

let cache: Map<string, Entry> | null = null;

export function entries(): Map<string, Entry> {
  if (cache) return cache;
  const map = new Map<string, Entry>();
  const common: Record<string, string> = {};
  const files = readdirSync(RAW).filter((f) => f.endsWith(".txt")).sort();
  for (const f of files) {
    const lines = readFileSync(join(RAW, f), "utf8").split(/\r?\n/);
    let cur: Entry | null = null;
    let inHeader = false;
    const close = () => {
      if (!cur) return;
      while (cur.lines.length && !cur.lines[cur.lines.length - 1].trim()) cur.lines.pop();
      map.set(cur.path, cur);
      cur = null;
    };
    for (const raw of lines) {
      const def = raw.match(/^@@C(\d+) (.*)$/);
      if (def) { common[def[1]] = def[2]; continue; }
      if (/^### (SITE META|COMPRESSED|Lines "@Cn")/.test(raw) || /^(NAV|SOCIAL): /.test(raw)) { close(); continue; }
      const head = raw.match(/^=== (\/\S*)$/);
      if (head) {
        close();
        cur = { path: head[1], kind: "page", title: "", desc: "", og: "", lines: [] };
        inHeader = true;
        continue;
      }
      if (!cur) continue;
      if (inHeader) {
        const m = raw.match(/^(K|S|T|D|OG|DT|H):\s?(.*)$/);
        if (m) {
          const v = fixText(m[2].trim());
          if (m[1] === "K") cur.kind = v as Kind;
          else if (m[1] === "S") cur.suburb = v;
          else if (m[1] === "T") cur.title = v;
          else if (m[1] === "D") cur.desc = v;
          else if (m[1] === "OG") cur.og = normImg(v);
          else if (m[1] === "DT") cur.date = v;
          else if (m[1] === "H") cur.h1 = v;
          continue;
        }
        inHeader = false;
      }
      cur.lines.push(raw);
    }
    close();
  }
  // Expand shared suburb lines and tidy text.
  for (const e of map.values()) {
    const S = e.suburb ?? "";
    e.lines = e.lines
      .map((l) => {
        const ref = l.match(/^@C(\d+)$/);
        const line = ref ? common[ref[1]] ?? "" : l;
        return fixText(S ? line.replaceAll("{S}", S) : line);
      })
      .filter((l, i, a) => !(l === "" && a[i - 1] === ""));
  }
  cache = map;
  return map;
}

export const get = (path: string) => entries().get(path);
export const all = (kind?: Kind) => [...entries().values()].filter((e) => !kind || e.kind === kind);

/** Readable page heading: explicit H1/H, else "# " line, else the SEO title without its brand suffix. */
export function headingOf(e: Entry): string {
  if (e.h1) return e.h1;
  const h = e.lines.find((l) => /^# /.test(l));
  if (h) return h.slice(2).trim();
  return cleanTitle(e.title);
}
export const cleanTitle = (t: string) =>
  t
    .replace(/\s+[|–-]\s+Associated Turf.*$/i, "")
    .replace(/\s+(from|by) Associated Turf.*$/i, "")
    .replace(/\s+[|–]\s+.*$/, "")
    .replace(/\s+-\s+(Sports Field Turf|Premium Couch Grass|Turf Preparation|Tips for.*|Quality Lawn.*)$/i, "")
    .trim();

/* ---------------------------------------------------------------- tokens */

export type Token =
  | { t: "h"; level: number; text: string }
  | { t: "img"; alt: string; src: string }
  | { t: "li"; text: string }
  | { t: "p"; text: string }
  | { t: "link"; text: string; href: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "marker"; name: string };

const CTA_WORDS = /^(Get a Free Home Quote|Explore Our Turf|Request a Quote|Learn More|View variety|Get a Free Quote|Request Trade Pricing|Order Fresh Turf)$/i;

export function tokenize(lines: string[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^TABLE: /.test(l)) {
      const head = l.slice(7).split("|").map((s) => s.trim());
      const rows: string[][] = [];
      while (++i < lines.length && lines[i].trim() !== "END TABLE") rows.push(lines[i].split("|").map((s) => s.trim()));
      out.push({ t: "table", head, rows });
      continue;
    }
    if (/^(QUOTE_FORM|GALLERY_IMAGES|BLOG_INDEX)$/.test(l)) { out.push({ t: "marker", name: l }); continue; }
    const h = l.match(/^(#{1,6})\s+(.*)$/);
    if (h) { out.push({ t: "h", level: h[1].length, text: h[2].trim() }); continue; }
    const im = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (im) { out.push({ t: "img", alt: im[1], src: normImg(im[2]) }); continue; }
    const lk = l.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lk && !/^\*\*/.test(lk[1])) { out.push({ t: "link", text: lk[1].replace(/\*\*/g, ""), href: lk[2] }); continue; }
    if (CTA_WORDS.test(l)) { out.push({ t: "link", text: l, href: "#quote" }); continue; }
    if (/^- /.test(l)) { out.push({ t: "li", text: l.slice(2).trim() }); continue; }
    out.push({ t: "p", text: l });
  }
  return out;
}

/** A short, sentence-free line used as a label above a heading ("For Homeowners"). */
export const isEyebrow = (tok?: Token) => !!tok && tok.t === "p" && tok.text.length <= 48 && !/[.!?:]$/.test(tok.text) && tok.text.split(" ").length <= 7;

/* ---------------------------------------------------------------- landing pages */

export interface Feature { eyebrow?: string; title: string; paras: string[]; bullets: string[]; image?: { src: string; alt: string }; cta?: string }
export interface Faq { q: string; a: string }
export interface Landing {
  hero: { eyebrow?: string; title: string; lede: string; chips: string[]; image?: string };
  quote: { title: string; text: string };
  reviewsTitle?: string;
  features: Feature[];
  varieties?: { title: string; text: string };
  midCta?: { title: string; text: string };
  why?: { title: string; text: string };
  steps?: { title: string; text: string };
  faq?: { title: string; intro?: string; items: Faq[] };
  finalImage?: string;
  final?: { title: string; text: string };
}

/** Parse the shared structure used by the newer service and supplier pages. Returns null for other layouts. */
export function landing(e: Entry): Landing | null {
  const toks = tokenize(e.lines);
  const h1i = toks.findIndex((t) => t.t === "h" && t.level === 1);
  const firstH2 = toks.findIndex((t) => t.t === "h" && t.level === 2);
  if (h1i < 0 || firstH2 < 0 || firstH2 < h1i) return null;
  const qt = toks[firstH2] as Extract<Token, { t: "h" }>;
  if (!/quote$/i.test(qt.text)) return null;

  const pre = toks.slice(0, h1i);
  const heroImg = pre.find((t) => t.t === "img") as Extract<Token, { t: "img" }> | undefined;
  const eyebrowTok = [...pre].reverse().find((t) => t.t === "p") as Extract<Token, { t: "p" }> | undefined;
  const afterH1 = toks.slice(h1i + 1, firstH2);
  const lede = (afterH1.find((t) => t.t === "p") as any)?.text ?? "";
  const chips = afterH1.filter((t) => t.t === "li").map((t: any) => t.text);

  // Group remaining tokens by h2, moving trailing eyebrow/image tokens onto the next group.
  type Group = { title: string; eyebrow?: string; image?: { src: string; alt: string }; body: Token[] };
  const groups: Group[] = [];
  for (let i = firstH2; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === "h" && t.level === 2) { groups.push({ title: t.text, body: [] }); continue; }
    groups[groups.length - 1]?.body.push(t);
  }
  for (let g = 0; g < groups.length - 1; g++) {
    const body = groups[g].body;
    const next = groups[g + 1];
    if (isEyebrow(body[body.length - 1]) && !(body.length >= 2 && body[body.length - 2].t === "p" && /\?$/.test((body[body.length - 2] as any).text))) {
      next.eyebrow = (body.pop() as any).text;
    }
    if (body[body.length - 1]?.t === "img") { const im = body.pop() as any; next.image = { src: im.src, alt: im.alt }; }
  }

  const res: Landing = {
    hero: { eyebrow: eyebrowTok?.text, title: (toks[h1i] as any).text, lede, chips, image: heroImg?.src },
    quote: { title: groups[0].title, text: (groups[0].body.find((t) => t.t === "p") as any)?.text ?? "" },
    features: [],
  };
  let gi = 1;
  if (groups[gi] && !groups[gi].body.some((t) => t.t === "p")) { res.reviewsTitle = groups[gi].title; gi++; }

  // Features: groups that carry bullets.
  while (groups[gi] && groups[gi].body.some((t) => t.t === "li")) {
    const g = groups[gi];
    const isQa = g.body.some((t) => t.t === "p" && /\?$/.test((t as any).text));
    if (isQa) break;
    res.features.push({
      eyebrow: g.eyebrow, title: g.title, image: g.image,
      paras: g.body.filter((t) => t.t === "p").map((t: any) => t.text),
      bullets: g.body.filter((t) => t.t === "li").map((t: any) => t.text),
      cta: (g.body.find((t) => t.t === "link") as any)?.text,
    });
    gi++;
  }
  const rest = groups.slice(gi);
  const faqIdx = rest.findIndex((g) => g.body.filter((t) => t.t === "p" && /\?$/.test((t as any).text)).length >= 2);
  const between = faqIdx >= 0 ? rest.slice(0, faqIdx) : rest.slice(0, -1);
  const simple = (g?: Group) => (g ? { title: g.title, text: (g.body.find((t) => t.t === "p") as any)?.text ?? "" } : undefined);
  const pick = (re: RegExp) => between.find((g) => re.test(g.title));
  res.varieties = simple(pick(/variet|grass|compare|choose|six|turf before|grown on our/i) ?? between[0]);
  res.steps = simple(pick(/step|easy|placing|working with|booking|planning your|finding|paddock to your|farm to your lawn|ordering/i) ?? between[3]);
  res.midCta = simple(between.find((g) => /\?$/.test(g.title) && g !== res.varieties && g !== res.steps) ?? between[1]);
  const used = new Set([res.varieties?.title, res.steps?.title, res.midCta?.title]);
  res.why = simple(between.find((g) => !used.has(g.title)));
  if (faqIdx >= 0) {
    const fg = rest[faqIdx];
    const body = fg.body.filter((t) => t.t === "p" || t.t === "img") as any[];
    const items: Faq[] = [];
    let intro: string | undefined;
    let j = 0;
    while (j < body.length && body[j].t === "p" && !/\?$/.test(body[j].text)) { intro = (intro ? intro + " " : "") + body[j].text; j++; }
    for (; j < body.length; j++) {
      const t = body[j];
      if (t.t === "img") { res.finalImage = t.src; continue; }
      if (/\?$/.test(t.text) && body[j + 1]?.t === "p") { items.push({ q: t.text, a: body[j + 1].text }); j++; }
    }
    if (intro) intro = intro.replace(/Side box:.*$/, "").trim();
    res.faq = { title: fg.title, intro, items };
    const fin = rest[faqIdx + 1];
    if (fin) { res.final = simple(fin); if (fin.image) res.finalImage = fin.image.src; }
    if (rest[faqIdx].image) res.finalImage ??= undefined;
  } else {
    res.final = simple(rest[rest.length - 1]);
  }
  return res;
}

/* ---------------------------------------------------------------- articles */

export type Block =
  | { b: "html"; md: string }
  | { b: "figure"; src: string; alt: string }
  | { b: "gallery"; images: { src: string; alt: string }[] }
  | { b: "table"; head: string[]; rows: string[][] }
  | { b: "faq"; title: string; items: Faq[] }
  | { b: "overview" }
  | { b: "button"; text: string; href: string }
  | { b: "marker"; name: string };

/** Convert free-form legacy content into typed blocks for the article template. */
export function article(e: Entry, opts: { dropHeading?: string } = {}): Block[] {
  let toks = tokenize(e.lines).filter((t) => !(t.t === "h" && t.level === 1));
  if (opts.dropHeading) {
    const k = toks.findIndex((t) => t.t === "h" && t.text === opts.dropHeading);
    if (k >= 0 && k < 3) toks.splice(k, 1);
  }
  const levels = toks.filter((t) => t.t === "h").map((t: any) => t.level as number);
  const min = levels.length ? Math.min(...levels) : 2;
  const hl = (n: number) => Math.min(4, 2 + (n - min));
  const blocks: Block[] = [];
  let buf: string[] = [];
  const flush = () => { if (buf.length) { blocks.push({ b: "html", md: buf.join("\n\n").replace(/\n\n(?=- )/g, "\n") }); buf = []; } };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.t === "h" && /^turf overview$/i.test(t.text)) {
      flush(); blocks.push({ b: "overview" });
      while (toks[i + 1]?.t === "p" && /^(Disease Resistance|Wearability|Frost Resistance|Shade Tolerance)$/.test((toks[i + 1] as any).text)) i++;
      continue;
    }
    if (t.t === "h" && /questions and answers|frequently asked|^faqs?$/i.test(t.text)) {
      // Collect "Q?" headings (or lines) each followed by answer paragraphs/lists.
      const items: Faq[] = [];
      let j = i + 1;
      while (j < toks.length) {
        const q = toks[j] as any;
        const isQ = (q.t === "h" && q.level > (t as any).level) || (q.t === "p" && /\?$/.test(q.text));
        if (!isQ) break;
        const ans: string[] = [];
        let k = j + 1;
        while (k < toks.length && (toks[k].t === "p" || toks[k].t === "li") && !((toks[k] as any).t === "p" && /\?$/.test((toks[k] as any).text) && toks[k + 1]?.t === "p")) {
          ans.push(toks[k].t === "li" ? `- ${(toks[k] as any).text}` : (toks[k] as any).text);
          k++;
        }
        if (!ans.length) break;
        items.push({ q: q.text, a: ans.join("\n\n").replace(/\n\n(?=- )/g, "\n") });
        j = k;
      }
      if (items.length) { flush(); blocks.push({ b: "faq", title: t.text, items }); i = j - 1; continue; }
    }
    if (t.t === "h") { buf.push(`${"#".repeat(hl(t.level))} ${t.text}`); continue; }
    if (t.t === "img") {
      const imgs = [{ src: t.src, alt: t.alt }];
      while (toks[i + 1]?.t === "img") { const n = toks[++i] as any; imgs.push({ src: n.src, alt: n.alt }); }
      flush();
      blocks.push(imgs.length > 1 ? { b: "gallery", images: imgs } : { b: "figure", ...imgs[0] });
      continue;
    }
    if (t.t === "table") { flush(); blocks.push({ b: "table", head: t.head, rows: t.rows }); continue; }
    if (t.t === "marker") { flush(); blocks.push({ b: "marker", name: t.name }); continue; }
    if (t.t === "link") {
      if (/^view more$/i.test(t.text) || t.href === "#quote") { flush(); blocks.push({ b: "button", text: t.text === "View More" ? "View Variety" : t.text, href: t.href }); }
      else buf.push(`[${t.text}](${t.href})`);
      continue;
    }
    if (t.t === "li") { buf.push(`- ${t.text}`); continue; }
    buf.push(t.text);
  }
  flush();
  return blocks;
}

/** All FAQ items in an article (for FAQPage schema). */
export const faqsOf = (blocks: Block[]) => blocks.flatMap((b) => (b.b === "faq" ? b.items : []));

/** First image used in a page body (fallback hero / card image). */
export const firstImage = (e: Entry) => {
  const m = e.lines.map((l) => l.match(/^!\[[^\]]*\]\(([^)]+)\)$/)).find(Boolean);
  const src = m ? normImg(m[1]) : "";
  return src || (e.og && !/associated-turf-logo/.test(e.og) ? e.og : "");
};

/** Plain-text excerpt from the first real paragraph. */
export function excerpt(e: Entry, n = 170) {
  const p = e.lines.find((l) => l.length > 80 && !/^(#|!|-|\[|TABLE)/.test(l)) ?? e.desc;
  const s = p.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|_/g, "");
  return s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "…" : s;
}

/** Every uploads image referenced anywhere in the content, in first-seen order. */
export function allImages(): string[] {
  const set = new Set<string>();
  for (const e of entries().values()) {
    for (const l of e.lines) for (const m of l.matchAll(/\]\((?:U\/|\/wp-content\/uploads\/)([^)]+\.(?:jpe?g|png|webp))\)/gi)) set.add(m[1]);
    if (e.og) set.add(e.og);
  }
  return [...set];
}

/** Pull a hero (heading, label, lede, image) off the top of a legacy page; returns the remaining lines. */
export function splitIntro(e: Entry, opts: { lede?: boolean } = {}) {
  const lines = [...e.lines];
  const out: { h1: string; label?: string; lede?: string; image?: string; imageAlt?: string; lines: string[] } = { h1: headingOf(e), lines };
  const next = () => { while (lines.length && !lines[0].trim()) lines.shift(); return lines[0] ?? ""; };
  const isH = (l: string) => /^#{1,6}\s/.test(l);
  const strip = (l: string) => l.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "").trim();
  for (let guard = 0; guard < 6; guard++) {
    const l = next();
    const im = l.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (im && !out.image) { out.image = normImg(im[2]); out.imageAlt = im[1]; lines.shift(); continue; }
    if (isH(l) && guard < 3) {
      const t = strip(l);
      if (!e.h1 && out.h1 === headingOf(e) && !out.label && guard === 0 && !/^#\s/.test(l)) { out.h1 = t; lines.shift(); continue; }
      if (/^#\s/.test(l)) { lines.shift(); continue; }
      if (!out.label && t.length < 70 && (t === e.h1 || /trusted name|^associated turf/i.test(t))) { out.label = t.replace(/^Associated Turf\s+[–-]\s+/i, ""); lines.shift(); continue; }
      break;
    }
    if (/^\*\*[^*]+\*\*$/.test(l) && strip(l) === out.h1) { lines.shift(); continue; }
    break;
  }
  if (opts.lede !== false) {
    const l = next();
    if (l && !/^(#|!|-|\[|TABLE|QUOTE_FORM|GALLERY_IMAGES|BLOG_INDEX)/.test(l) && l.length > 40) { out.lede = l; lines.shift(); }
    else if (l && !/^(#|!|-|\[|TABLE)/.test(l) && l.length <= 60 && !/[.!?]$/.test(l) && !out.label) { out.label = l; lines.shift(); const l2 = next(); if (l2 && !/^(#|!|-|\[|TABLE)/.test(l2) && l2.length > 40) { out.lede = l2; lines.shift(); } }
  }
  out.lines = lines;
  return out;
}
