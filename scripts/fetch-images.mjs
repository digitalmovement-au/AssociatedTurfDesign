// Downloads every WordPress image the site references into public/uploads/,
// so the new site no longer depends on the old WordPress server.
// Usage: npm run fetch-images   then build with PUBLIC_UPLOADS_BASE=/uploads
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const SRC = "https://associatedturf.com.au/wp-content/uploads/";
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = [...walk("src"), ...walk("content")].filter((f) => /\.(ts|astro|txt)$/.test(f));
const paths = new Set();
for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/(?:U\/|")(20\d\d\/\d\d\/[^")\s]+\.(?:jpe?g|png|webp))/g)) paths.add(m[1]);

let ok = 0, fail = 0;
for (const p of paths) {
  const out = join("public/uploads", p);
  if (existsSync(out)) { ok++; continue; }
  try {
    const res = await fetch(SRC + p);
    if (!res.ok) throw new Error(res.status);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    ok++; console.log("✓", p);
  } catch (e) { fail++; console.warn("✗", p, e.message); }
}
console.log(`\n${ok} saved, ${fail} failed. Now set PUBLIC_UPLOADS_BASE=/uploads and rebuild.`);
