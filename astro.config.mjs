import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Production: served from the domain root. Previews (e.g. GitHub Pages) can set BASE_PATH=/AssociatedTurfDesign.
const base = (process.env.BASE_PATH || "/").replace(/\/?$/, "/");
const site = process.env.SITE_URL || "https://associatedturf.com.au";

/** Content links are written root-relative ("/about/"). When deployed under a sub-path, prefix them after build. */
const prefixLinks = () => ({
  name: "prefix-root-links",
  hooks: {
    "astro:build:done": ({ dir }) => {
      if (base === "/") return;
      const root = fileURLToPath(dir);
      const b = base.replace(/\/$/, "");
      const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
      for (const f of walk(root).filter((f) => f.endsWith(".html"))) {
        const html = readFileSync(f, "utf8").replace(/(\s(?:href|src|action|poster)=")\/(?!\/)/g, (m, attr) => `${attr}${b}/`);
        writeFileSync(f, html.replaceAll(`${b}${b}/`, `${b}/`));
      }
    },
  },
});

export default defineConfig({
  site,
  base,
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [sitemap(), prefixLinks()],
  vite: { plugins: [tailwindcss()] },
});
