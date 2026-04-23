# Available Site Analyses

Quick reference for the types of audits and analyses that can be run on the Variant A site (or any variant).

---

## CSS / Styling

| Analysis                       | What It Finds                                               |
| ------------------------------ | ----------------------------------------------------------- |
| Cross-page selector audit      | Unused, dead, or conflicting CSS rules across all pages     |
| Specificity conflict detection | Rules that cancel each other out due to specificity battles |
| Responsive breakpoint audit    | `@media` block consistency and gaps across pages            |
| Font/variable usage audit      | Unresolved `var()` references, missing design tokens        |
| Per-page CSS drift             | Duplication between shared and per-page stylesheets         |

---

## HTML Structure

| Analysis                        | What It Finds                                                       |
| ------------------------------- | ------------------------------------------------------------------- |
| Class/attribute consistency     | Component naming mismatches across pages (e.g., renamed classes)    |
| Accessibility audit             | Missing `alt`, `aria-*`, form labels, broken heading hierarchy      |
| Multilingual attribute coverage | Elements missing `data-en` / `data-es` / `data-pt` attributes       |
| Anchor/link audit               | Dead `href="#..."`, broken relative paths, missing `tel:`/`mailto:` |

---

## Cross-Variant Comparison

| Analysis                   | What It Finds                                             |
| -------------------------- | --------------------------------------------------------- |
| Variant A vs. B vs. C diff | What's unique to each variant and what has diverged       |
| Feature parity check       | Missing CTA structure, nav links, or forms in any variant |

---

## Performance

| Analysis                     | What It Finds                                                      |
| ---------------------------- | ------------------------------------------------------------------ |
| Asset load order audit       | Render-blocking CSS/JS, missing `defer` / `async`                  |
| Cache-bust token consistency | Linked assets missing version query strings                        |
| Image audit                  | Missing `width`/`height`, no `loading="lazy"` on below-fold images |

---

## Functional / Integration

| Analysis                   | What It Finds                                                                    |
| -------------------------- | -------------------------------------------------------------------------------- |
| API endpoint audit         | Direct `script.google.com` URLs that should route through the Cloudflare proxy   |
| Form action audit          | Confirms `apply.html` and other forms point to the correct Apps Script endpoints |
| Service worker scope check | Coverage gaps in `manifest-employee.json` and `service-worker-employee.js`       |

---

_To run any of these, ask: "Run a [analysis name] on Variant A" (or B/C)._
