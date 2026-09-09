# fusionframe.work

Marketing site for fusionframe.work. GitHub Pages serves the repository root.

## Structure

```
index.html            ← Home page (enterprise audience)
challenge/index.html  ← The Idea to Impact Challenge
platform/index.html   ← Platform, analytics, custom UI (business audience)
lifecycle/index.html  ← The built-in development lifecycle, AI-native change flow
technology/index.html ← Integration, less code, technology (technical audience)
pricing/index.html    ← Pricing, offers, lock-in ledger
replace-legacy/index.html ← Legacy replacement: fixed-scope discovery and design, TCO baseline, value-based deal
services/index.html   ← Services firms page
redesign/             ← Redirect stubs for the old /redesign/ URLs
archive/              ← Superseded page, kept for reference
explainer/            ← Standalone explainer page
css/
  input.css           ← Tailwind source (edit this; also holds the shared base styles)
  output.css          ← Compiled Tailwind (generated)
js/
  site.js             ← Shared script: hero canvas, footer year, lucide icons
site/
  css/                ← Styles for archive/
  js/                 ← Script for archive/
  images/             ← Screenshots, favicon, Open Graph image
sitemap.xml
robots.txt
CNAME
```

The shared base styles (palette tokens, hero, reveal, links) live in
`css/input.css` and compile into `css/output.css`, which every page loads. Each
page holds only its own section CSS in a `<style>` block; the services page also
overrides the `:root` palette there. Tailwind supplies the utility classes and
DaisyUI supplies `btn`, `card`, `badge`, `dropdown`, `menu` and `checkbox`. The home page carries a small script
that forwards the old single-page anchors (for example `/#pricing`) to the
sub-pages.

Two rules for `css/input.css`:

- If you add a page, add an `@source` line for it, or its classes do not compile.
- If you use a new DaisyUI class, add its component to the `include:` list, or the
  class does nothing. The list exists because DaisyUI is not tree-shaken reliably:
  it emits a component whenever its name appears in the scanned HTML, and words
  such as `card` and `loading` appear in the prose and in `loading="lazy"`.

## Development

Install the dependencies:

```sh
npm install
```

Serve the site:

```sh
python3 -m http.server 8080
```

Watch for CSS changes during development:

```sh
npm run dev:css
```

## Deployment

A push to `main` deploys the site. Rebuild the CSS before you push:

```sh
npm run build:css
git add css/output.css
git commit
git push
```
