# Associated Turf: website redesign

Static rebuild of [associatedturf.com.au](https://associatedturf.com.au) in Astro. All 148 live URLs (pages, 39 suburb pages, 58 news posts) keep their paths, titles, meta descriptions and content, plus a new `/shademaster-soft-leaf-buffalo-turf/` page (the live site links to it but it 404s).

## Design
"Fresh-mown": Associated's own brand (Fraunces headings, Poppins body, field green `#00A335`, forest `#0C2419`) on a light, editorial layout.
- **Mown-stripe reveals**: photos are uncovered by six alternating "mower passes".
- **Mower progress line** under the header tracks how far you've scrolled.
- **Striped lawn fields** behind key sections drift gently as you scroll.
- The four-step process has a mower that cuts its way along as you scroll.

## Content
Migrated content lives in `content/raw/*.txt` (one block per URL). `src/lib/content.ts` parses it at build time:
- newer service and supplier pages → the `Landing` template (hero, features, varieties, why, steps, FAQ, quote);
- older pages, suburb pages and posts → the `Article` template (FAQs become accordions, tables and galleries are rendered properly).
To edit copy, edit the matching block in `content/raw/` and rebuild.

## Run
```
npm ci
npm run dev        # http://localhost:4321
npm run build      # outputs dist/
```
Environment variables:
- `PUBLIC_UPLOADS_BASE`: where images come from (defaults to the live WordPress uploads). Run `npm run fetch-images` then set `/uploads` to self-host.
- `PUBLIC_FORM_ENDPOINT`: optional form endpoint (Formspree etc). Without it, forms post to Netlify Forms.
- `PUBLIC_GTM_ID`: optional Google Tag Manager ID.
- `BASE_PATH`, `PUBLIC_NOINDEX`: used by the GitHub Pages preview workflow.
