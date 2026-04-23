# Priority1-Inspired Style System for CLS Variant A

## Goal

Apply the layout and color strengths from Priority1 while keeping Carolina Lumper Service branding and voice.

## Core Visual Direction

- Commercial B2B tone: confident, practical, conversion-first.
- Neutral base with a controlled accent ratio.
- Repeating section rhythm so long pages remain easy to scan on desktop and mobile.

## Color System

Use these exact tokens across pages.

```css
:root {
  --cls-bg: #ecebe7;
  --cls-surface: #ffffff;
  --cls-surface-muted: #f4f3f0;
  --cls-text: #171717;
  --cls-text-muted: #4b4b4b;
  --cls-charcoal: #2a2a2a;
  --cls-charcoal-strong: #1f1f1f;
  --cls-line: #d8d7d1;
  --cls-accent: #d8ab24;
  --cls-accent-strong: #b68813;
  --cls-danger: #b42318;
}
```

### Color Usage Rules

- 70% light neutrals: backgrounds, content areas.
- 20% dark anchors: hero, primary nav active state, high-emphasis blocks.
- 10% gold accents: CTA fills, eyebrow labels, small separators and highlights.
- Never use accent as large paragraph text color.

## Typography System

- Brand/display: Anton for wordmark and identity moments.
- Headlines: Cormorant Garamond for premium freight/commercial tone.
- Body/UI: Plus Jakarta Sans for readability and form controls.

### Sizing Scale

- Hero H1: clamp(2rem, 4.2vw, 3.35rem)
- Section H2: clamp(1.6rem, 2.4vw, 2.25rem)
- Body: 1rem base, 1.5 line-height
- Meta/eyebrow: 0.84rem, uppercase, letter-spacing 0.14em

## Layout Rhythm (Desktop and Mobile)

Use the same order on major pages.

1. Hero (message + image + primary CTA)
2. Core offers/services (3 cards)
3. Trust/proof strip (stats, policy clarity, contact trust)
4. Main conversion block (quote/apply/contact)
5. Footer utility links

### Spacing Rhythm

- Between major sections: 1.0rem to 1.2rem in current Variant A pattern.
- Card padding: clamp(1.05rem, 2vw, 1.5rem)
- Consistent border radius: 16px

## Navigation Pattern

- Desktop: horizontal pill links, active page in dark fill with white text.
- Mobile: hamburger only under 900px, expandable stacked nav links.
- Fixed page routes everywhere:
  - Home -> index.html
  - Services -> services.html
  - Contact -> contact.html
  - Careers -> apply.html

## Component Rules

### Hero Block

- Two-column on desktop.
- Dark gradient background and white text.
- One primary CTA and one secondary action max.

### Service/Feature Cards

- One-line title, short support text, 3 bullets max.
- Keep image treatment consistent across cards.
- Avoid large paragraph blocks inside cards.

### CTAs

- Primary CTA: accent fill with dark text.
- Secondary CTA: outline or muted surface.
- Keep labels action-first: "Request Quote", "Call Now", "Apply Now".

### Forms

- One-page flow where possible.
- Minimize perceived risk:
  - Explain why data is requested.
  - Explicitly list what is not requested.
  - Place verification contact near top.
- Required marker only where strictly needed.

## Trust Design System

Include a trust strip near top on high-intent pages (contact/apply):

- How information is used.
- What data is not requested.
- Verification path (phone/email).

## Mobile-First Behavior

- Collapse 2-column sections to 1 column at <= 980px.
- Use single-column forms at <= 900px.
- Keep CTA buttons full-width in forms.
- Keep wordmark legible at ~1rem on narrow screens.

## Implementation Checklist by Page

### index.html

- Keep dark hero + strong value proposition.
- Include one primary and one secondary CTA above fold.
- Add trust metrics strip after services if missing.

### services.html

- Maintain 3-card service structure.
- Keep copy concise and action-driven.
- Preserve one conversion CTA after service details.

### contact.html

- Keep one simple quote form.
- Maintain direct contact card and quick trust language.
- Avoid adding non-essential fields.

### apply.html

- Keep single-page format.
- Keep DOB optional.
- Keep trust strip and avoid sensitive fields unless required later in hiring process.

## QA Checklist

- Desktop 1440px: section rhythm and CTA hierarchy are clear.
- Mobile 390px: nav toggle, readable heading scale, no cropped key content.
- Contrast: dark text on light surfaces, white text only on dark blocks.
- Cross-page consistency: same nav, buttons, radii, spacing cadence.

## Optional Next Step

Create a shared CSS foundation file (tokens + nav + card + CTA primitives) and point all Variant A pages to that single source to reduce drift.
