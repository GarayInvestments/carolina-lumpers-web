# Component Hierarchy & Naming Convention

## Overview

This document defines the semantic component hierarchy used across Carolina Lumpers Service Variant A. Each component has a clear purpose, human-understandable name, and consistent application across all pages.

---

## Component Tree

### Hero Section

```
.hero
├── .hero-content          ← All text content block (headline, subheading, badges, CTAs)
│   ├── .hero-label        ← Small overline label ("SERVING THE CAROLINAS")
│   ├── h1                 ← Main headline
│   ├── .hero-subtitle     ← Subheading / intro paragraph
│   ├── .hero-trust-badges ← Trust indicators (row of features: "NC+SC coverage", "Fast response")
│   │   └── span           ← Individual badge item
│   └── .hero-cta-group    ← CTA buttons container
│       ├── .btn-primary   ← Main action button
│       └── .hero-secondary-actions ← Secondary actions row
│           ├── .btn-secondary ← Secondary button (Call Now)
│           └── .btn-secondary ← Secondary button (Email)
└── picture              ← Image asset (hero photo)
```

### Navigation

```
.site-header              ← Header/navbar container
├── .wordmark            ← Logo/brand mark
├── .nav-toggle          ← Mobile hamburger menu button
└── #primary-nav         ← Navigation menu links
    └── a[aria-current] ← Active nav link indicator
```

### Footer

```
.site-footer             ← Footer container
├── .site-footer-brand   ← Logo/brand section in footer
├── .site-footer-links   ← Navigation/footer links
└── .site-footer-social  ← Social media icons
```

### Forms & Inputs

```
.form-card / .hero-form
├── h2                  ← Form title
├── form
│   ├── .form-group     ← Label + input pair
│   └── button          ← Submit button
```

### Buttons

```
.btn                     ← Base button component
├── .btn-primary        ← Primary action (yellow background, black text)
├── .btn-secondary      ← Secondary action (white/light background, dark text)
└── .btn:hover          ← Hover state
```

### Page-Specific Components

```
.about-section          ← Section on about page
├── h2                  ← Section heading
├── p / ul              ← Section content

.service-list           ← Service items container
├── li                  ← Individual service

.values-grid            ← 2×2 grid of values
├── .value-card         ← Individual value item

.trust-strip            ← Trust indicators on apply page
└── li                  ← Individual trust item
```

---

## Class Naming Convention

### Naming Rules

1. **Semantic first** — Names should describe _what_ the component is, not where it appears
2. **BEM-adjacent** — Use hyphens for child elements (`.hero-content`, `.hero-label`)
3. **Avoid vague names** — ❌ `.copy`, ❌ `.meta`, ❌ `.overview` → ✅ `.hero-content`, ✅ `.page-meta`, ✅ `.service-overview`
4. **Parent scope** — All hero-related components should start with `.hero-`
5. **State indication** — Use prefixes like `.is-`, `.has-` for states (`[aria-current="page"]` for nav)

### Naming Legend

| Purpose               | Old Name            | New Name                  | Usage                                                |
| --------------------- | ------------------- | ------------------------- | ---------------------------------------------------- |
| Hero text block       | `.hero-copy`        | `.hero-content`           | Container for headline, subtitle, trust badges, CTAs |
| Overline label        | `.hero-kicker`      | `.hero-label`             | Small text above headline ("SERVING THE CAROLINAS")  |
| Intro/subheading      | `.intro`            | `.hero-subtitle`          | Tagline/subheading below main headline               |
| Trust indicators      | `.hero-proof`       | `.hero-trust-badges`      | Row of features ("NC+SC coverage", "Fast response")  |
| Buttons container     | `.hero-actions`     | `.hero-cta-group`         | Wraps all CTA buttons in hero                        |
| Secondary buttons row | `.hero-actions-row` | `.hero-secondary-actions` | Wraps Call Now + Email buttons                       |
| Button element        | `.btn`              | `.btn`                    | (unchanged) Base button                              |

---

## CSS Structure

### File Organization

```
css/
├── variant-a-priority1-modules.css    ← Shared overrides for all Variant A pages
│   └── Rules scoped to: body.variant-a, body[class*="variant-a-"], [data-page="..."]
│
├── index-fresh-variant.css            ← Home page (index.html) specific
├── services-variant-a.css             ← Services page specific
├── contact-variant-a.css              ← Contact page specific
├── apply-variant-a.css                ← Apply page specific
├── about-variant-a.css                ← About page specific
│
└── [legacy files - not used in Variant A]
    ├── index-modern.css               (not variant-a)
    ├── style.css                      (legacy)
    └── base.css, components.css, etc. (shared)
```

### Selector Scoping Strategy

**Variant A pages use dual-scope selectors:**

```css
/* Applies to ALL variant-a pages */
body:is(.variant-a, [class*="variant-a-"]) .hero-content { ... }

/* Applies ONLY to home (body.variant-a) */
body.variant-a .hero-content { ... }

/* Applies ONLY to specific page */
body.variant-a-about .hero-content { ... }

/* Data-page attribute scoping */
[data-page="login"] .hero-content { ... }
```

---

## Page-Specific Assignments

### Body Class Convention

| Page     | Body Class                   | data-page              | Usage                                        |
| -------- | ---------------------------- | ---------------------- | -------------------------------------------- |
| Home     | `class="variant-a"`          | `data-page="home"`     | Home page with yellow slant/::after          |
| Services | `class="variant-a-services"` | `data-page="services"` | Service offerings page                       |
| Contact  | `class="variant-a-contact"`  | `data-page="contact"`  | Quote request / contact form                 |
| Apply    | `class="variant-a-apply"`    | `data-page="apply"`    | Job application page                         |
| About    | `class="variant-a-about"`    | `data-page="about"`    | Company info page                            |
| Login    | `class="variant-a"`          | `data-page="login"`    | Employee login (shares body class with home) |

### Variant A vs Legacy Pages

- **Variant A pages**: Use `body.variant-a`, `body.variant-a-*`, and `data-page` attributes
- **Legacy pages**: `employeeDashboard.html`, admin pages, w9 forms (not refactored)

---

## Examples

### Hero Section Markup

```html
<section class="hero">
  <div class="hero-content">
    <p class="hero-label">Serving the Carolinas</p>
    <h1>Dependable Warehouse Labor</h1>
    <p class="hero-subtitle">Reliable crews that keep freight moving.</p>
    <p class="hero-trust-badges">
      <span>NC + SC coverage</span>
      <span>Fast response</span>
      <span>Shift-ready crews</span>
    </p>
    <div class="hero-cta-group">
      <a class="btn btn-primary" href="contact.html">Request a Quote >></a>
      <div class="hero-secondary-actions">
        <a class="btn btn-secondary" href="tel:+18287810002">Call Now >></a>
        <a class="btn btn-secondary" href="mailto:info@carolinalumpers.com"
          >Email Us >></a
        >
      </div>
    </div>
  </div>
  <picture>
    <img src="hero.webp" alt="Warehouse team" />
  </picture>
</section>
```

### Hero CSS

```css
/* Shared across all variant-a pages */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 2rem;
}

.hero-content {
  display: grid;
  gap: 0.8rem;
  align-content: center;
}

.hero-label {
  color: var(--p1-yellow);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.hero-subtitle {
  font-size: 1.1rem;
  line-height: 1.5;
  color: #666;
}

.hero-trust-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.hero-trust-badges span {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
}

.hero-cta-group {
  display: grid;
  gap: 0.5rem;
}

.hero-secondary-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.hero-secondary-actions .btn {
  flex: 1;
}
```

---

## DevTools Inspection Guide

When using the browser's **Inspect Element** tool, you'll now see:

✅ **Clear, semantic names:**

```html
<div class="hero-content">
  <p class="hero-label">SERVING THE CAROLINAS</p>
  <h1>Dependable Warehouse Labor</h1>
  <p class="hero-subtitle">Reliable crews...</p>
  <p class="hero-trust-badges">
    <span>NC + SC coverage</span>
    <span>Fast response</span>
  </p>
</div>
```

❌ **Instead of vague names:**

```html
<div class="hero-copy">
  <p class="hero-kicker">...</p>
  <h1>...</h1>
  <p class="intro">...</p>
  <p class="hero-proof">...</p>
</div>
```

---

## Migration Notes

- **Refactored**: All 6 Variant A pages (index, services, contact, apply, about, login)
- **CSS files updated**: variant-a-priority1-modules.css, index-fresh-variant.css, services-variant-a.css, contact-variant-a.css, apply-variant-a.css, about-variant-a.css
- **Backward compatibility**: Old class names removed entirely (no legacy support)
- **Breaking changes**: If custom CSS or JS references old names, update to new names

---

## Future Improvements

1. **Extend to all pages** — Apply to legacy admin, w9 forms, etc.
2. **CSS custom properties** — Move all spacing, colors to `:root` variables
3. **Component storybook** — Visual catalog of all components at different breakpoints
4. **Accessibility audit** — Ensure all interactive components have proper ARIA labels

---

## Questions?

Refer to this document when:

- Adding new components → use the naming convention
- Debugging CSS in DevTools → identify component by human-readable class name
- Refactoring other pages → follow the hero section as a template
