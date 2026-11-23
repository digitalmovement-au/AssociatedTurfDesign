import { Marked } from "marked";

const marked = new Marked({ gfm: true, breaks: false, async: false });
marked.use({
  renderer: {
    link({ href, text }) {
      const ext = /^https?:\/\//.test(href) && !href.includes("associatedturf.com.au");
      return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
    },
  },
});

/** Block markdown → HTML (paragraphs, lists, links, bold). */
/** Tidy bold markers marked could not pair (e.g. "**text **" from the legacy CMS). */
const fixBold = (h: string) => h.replace(/\*\*([^*<>]+?)\s*\*\*/g, (_m, t) => `<strong>${t.trim()}</strong>`).replace(/\*\*/g, "");
export const md = (s = "") => fixBold(marked.parse(s) as string);
/** Inline-only markdown → HTML. */
export const mdi = (s = "") => fixBold(marked.parseInline(s) as string);
/** Strip markdown for plain-text contexts such as JSON-LD. */
export const plain = (s = "") => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|_/g, "").replace(/^- /gm, "").replace(/\n{2,}/g, " ").trim();

/** Resolve "U/yyyy/mm/file" image paths inside markdown before rendering. */
import { img } from "../data/site";
export const mdc = (s = "") => md(s.replace(/\]\((U\/[^)]+)\)/g, (_m, p) => `](${img(p)})`));
