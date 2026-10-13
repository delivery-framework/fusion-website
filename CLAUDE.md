# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

The static marketing site for fusionframe.work. The site has no framework, no
bundler, no tests and no linter. GitHub Pages serves the repository root, and a
push to `main` deploys the site. Commits go directly to `main`.

## Commands

```sh
npm install                      # Tailwind CLI and DaisyUI
python3 -m http.server 8080      # serve the site at http://localhost:8080
npm run dev:css                  # rebuild css/output.css on each change
npm run build:css                # minified build; run before you commit
```

`css/output.css` is generated, but it is committed, because GitHub Pages does not
build. If you change classes in any HTML file or in `css/input.css`, run
`npm run build:css` and commit `css/output.css` with the change. Browsers cache
`js/site.js` and `css/output.css`, so use a force refresh when you check a change.

## Architecture

Each page is a self-contained `<page>/index.html`. There are no includes or
templates, so the `<head>`, the header nav, the mobile menu and the footer are
copied into every page:

- If you change the nav, the footer, the booking link or the analytics snippet,
  change every page. `git grep` the old markup to find each copy.
- `challenge/index.html` only forwards the old address to `/idea-to-impact/`. It has
  no header, footer or analytics.
- The home page has a small inline script that forwards old single-page anchors
  (for example `/#pricing`) to the sub-pages.

To add a page, copy an existing page. Then do these steps:

1. Add an `@source` line for the page in `css/input.css`, or its classes do not compile.
2. Add the page to `sitemap.xml`.
3. Add the page to the structure list in `README.md`.

### CSS

- `css/input.css` holds the Tailwind v4 setup, the palette tokens (`--accent-*`,
  `--torus-*`, `--hero-glow`) and the base styles that every page shares (hero,
  grain, reveal, links, and the current-page nav style).
- Each page keeps only its own section CSS in a `<style>` block in its `<head>`.
- Fonts: Fraunces for headings (`font-display`), Inter Tight for body text,
  IBM Plex Mono (`--mono`) for section labels and figures, and Space Grotesk
  for the `.wordmark` only.
- The look is a "precision instrument". The tokens in `:root` are `--mono`, the
  radius scale `--r-xs/sm/md/lg` (3, 6, 8 and 12px), the hairlines `--hair*`,
  `--tick`, `--signal` (the amber status dot), `--focus-ring` and the blueprint
  grid colours. The `@theme` block redefines `rounded-xl`, `rounded-2xl` and
  `rounded-3xl` as 8, 10 and 12px, so those classes are smaller than Tailwind's.
- Amber is a signal colour: status dots, the current tab, the primary hero
  button and the Fusion column. Large figures are white on dark surfaces and
  ink on light ones, in `--mono`.
- Dark surfaces: one rule in `css/input.css` switches the focus ring, the tick
  colour and the label colour (`--eyebrow`) to light values on `.bg-ink`,
  `.hero-bg`, `.grain`, `.blueprint`, `header`, `.run-total` and `.less-stat`.
  If you add a dark panel that has none of these classes, add it to that rule.
  If you do not, its section labels turn dark on dark and its focus ring fails
  contrast.
- Section labels: use `.eyebrow` (a status dot, a mono label and a tick ruler).
  A second selector, `p.uppercase[class*="tracking-[0.25em]"]`, gives the old
  label markup on the inner pages the same look.
- Field lines: the torus seen edge-on, as SVG mask tiles (`--field-tile` and
  `--field-tile-lg`). They appear in `.field-seam` (a divider between two
  sections), in `.field-bg` (a large braid behind a dark section) and in
  `footer::before` (a divider at the top of the footer on every page). All three
  drift slowly and stop under `prefers-reduced-motion`.
- DaisyUI is limited by the `include:` list in `css/input.css` (now `button, card,
  badge, dropdown, menu, checkbox`). DaisyUI emits a component when its name
  appears anywhere in the HTML, and words such as `card` and `loading` appear in
  the prose. Before you use a new DaisyUI component, add it to the list, or its
  classes do nothing.

### js/site.js

One shared script, loaded at the end of each page:

- **Hero tokamak:** a canvas animation on `#heroCanvas`, which only `index.html`
  has. It draws 26 closed field lines on a spinning
  torus, with a time-based clock capped at about 60 fps. It pauses off screen and
  honours `prefers-reduced-motion`. Comets travel along the lines: one automatic
  flare every 6–9 s, and more when the pointer moves over a line. `MAX_COMETS`,
  `HOVER_GAP` and `HOVER_R` set the limits. The canvas has
  `pointer-events: none`, so the pointer listeners are on the hero `<section>`.
  The colours come from the `--torus-*` CSS variables.
- **Footer year** and **Lucide icons** (`data-lucide` attributes, loaded from unpkg).
  Every page pins the same Lucide version (`lucide@1.48.0`). If you change the
  version, change it on every page.
- **Current page:** the script sets `aria-current="page"` on header nav links,
  on the header Idea to Impact button (`.nav-cta`) and on mobile menu links that
  match the current path. It skips links with a hash.

### Images

Screenshots live in `site/images/platform/` as `.avif` and `.webp` pairs, used
in `<picture>` elements with `loading="lazy"`. Pages also use
`site/images/favicon.svg` and `site/images/og-image.png` from the same folder.

## Analytics

Plausible (`plausible.io/js/pa-…js`) runs on every page. It
sets no cookies, and it also tracks outbound links, file downloads and form
submissions. The script ignores `localhost` and automated browsers, unless the
browser sets `window.__plausible = true`.

Every CTA link carries event classes. If you add a CTA, add them:

```html
class="btn … plausible-event-name=Book+Meeting plausible-event-position=hero plausible-event-cta=Book+a+demo"
```

- `plausible-event-name`: `Book+Meeting` for a Google Calendar booking link, or
  `CTA+Click` for a link inside the site.
- `plausible-event-position`: `header`, `hero`, `body`, `offers` or `final`.
- `plausible-event-cta`: the button text, with `+` for each space.
- The pricing offer links also carry `plausible-event-offer`.

## Privacy policy

`privacy/index.html` follows the New Zealand Privacy Act 2020. It names Fusion
Framework Limited and each third party that the site loads: Plausible, Google
Calendar booking, Google Fonts, unpkg and Simple Icons. If you add or remove a third-party service, update the policy and
its "Last updated" date.
