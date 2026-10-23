# fusionframework.ai

Marketing site for fusionframework.ai. Cloudflare Workers (static assets) serves the
repository root. Workers Builds deploys each push to `main`, and gives each other
branch a preview URL.

## Structure

```
index.html            ← Home page (enterprise audience)
platform/index.html   ← Platform, analytics, custom UI (business audience)
lifecycle/index.html  ← The built-in development lifecycle, AI-native change flow
technology/index.html ← Integration, less code, technology (technical audience)
pricing/index.html    ← Pricing, offers, lock-in ledger
replace-legacy/index.html ← Legacy replacement: fixed-scope discovery and design, TCO baseline, quoted build, value-based deal on request
escape/index.html     ← Escape Salesforce, ServiceNow & Dynamics: metadata read, observation sessions, rebuild on Fusion with the pain points, docs and controls fixed
  salesforce/index.html   ← Escape Salesforce: what we read from the org (Metadata API, Tooling API) and where each part goes on Fusion
  servicenow/index.html   ← Escape ServiceNow: what we read from the instance (Table API) and where each part goes on Fusion
  dynamics-365/index.html ← Escape Dynamics 365: what we read from the environment (Dataverse Web API) and where each part goes on Fusion
about/index.html      ← About: why we built Fusion, the trace from problem to code, the team
privacy/index.html    ← Privacy policy (NZ Privacy Act 2020, Plausible analytics)
saas-wars/index.html  ← SaaS Wars: a parody opening crawl about the Data Paywall, with pause, replay and skip controls and a static version for reduced motion
404.html              ← The page for an unknown address (noindex)
css/
  input.css           ← Tailwind source (edit this; also holds the shared base styles)
  output.css          ← Compiled Tailwind (generated)
js/
  site.js             ← Shared script: hero canvas, footer year, lucide icons
site/
  images/             ← Screenshots, favicon, Open Graph image
sitemap.xml
robots.txt
wrangler.jsonc        ← Cloudflare Worker: name, custom domains, HTML handling
.assetsignore         ← Files that Cloudflare does not upload (docs, package files, css/input.css)
_redirects            ← Redirects (301), for example the old Idea to Impact addresses
_headers              ← Security headers and cache rules
```

The shared base styles (palette tokens, hero, reveal, links) live in
`css/input.css` and compile into `css/output.css`, which every page loads. Each
page holds only its own section CSS in a `<style>` block. Tailwind supplies the utility classes and
DaisyUI supplies `btn`, `card`, `badge`, `dropdown`, `menu` and `checkbox`. The home page carries a small script
that forwards the old single-page anchors (for example `/#pricing`) to the
sub-pages.

Two rules for `css/input.css`:

- If you add a page, add an `@source` line for it, or its classes do not compile.
- If you use a new DaisyUI class, add its component to the `include:` list, or the
  class does nothing. The list exists because DaisyUI is not tree-shaken reliably:
  it emits a component whenever its name appears in the scanned HTML, and words
  such as `card` and `loading` appear in the prose and in `loading="lazy"`.

## Analytics

Plausible counts page views, and also counts clicks on outbound links, file
downloads and form submissions. Every CTA link also carries CSS classes that
send a custom event:

```html
<a href="https://calendar.app.google/…" class="btn … plausible-event-name=Book+Meeting plausible-event-position=hero plausible-event-cta=Book+a+demo">
```

- `plausible-event-name`: `Book+Meeting` for a booking link, or `CTA+Click` for a link inside the site.
- `plausible-event-position`: `header`, `hero`, `body`, `offers` or `final`.
- `plausible-event-cta`: the button text.

A `+` shows as a space in Plausible. If you add a CTA, add these classes. A
goal for each event name must exist in the Plausible dashboard.

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
