# Cyber Tools Map

An interactive, bilingual (ES/EN) map of cybersecurity tools, grouped by zone
(offensive / defensive / cross-cutting) and category. Each tool opens a card with
a short description, a legitimate-use example and a link to its official site.

Built for educational use as a portfolio project. Only use the listed tools on
your own systems or with explicit authorization.

## Stack

Plain HTML, CSS and vanilla JavaScript (native ES modules). No build step, no
dependencies — it is served as static files and deploys to GitHub Pages as-is.

## Project layout

```
index.html            Entry point; mounts the app and inlines the icon sprite
src/
  main.js             Bootstrap: loads data, builds lookups, mounts views
  state.js            Tiny observable store (single source of truth)
  i18n.js             Locale loading and key resolution
  search.js           Accent-insensitive index over name, tags and text
  views/
    controls.js       Search, language, branch mode, theme toggle
    tree.js           Category -> subcategory -> tool tree
    panel.js          Tool detail card
styles/
  tokens.css          Design tokens: colour, type, spacing (per theme)
  app.css             Component styles
data/
  taxonomy.json       Zones -> categories -> subcategories (structure only)
  tools.json          Tool records with inline ES/EN free text
  i18n/{es,en}.json   UI strings and localized labels
assets/
  icons.svg           SVG sprite referenced by <use href="#icon-...">
```

## Running locally

ES modules and `fetch` need an HTTP origin, so open the project through a local
server rather than `file://`. In VS Code the *Live Server* extension works; or:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Adding a tool

Add one record to `data/tools.json`. Identifiers and enumerated fields
(`license`, `level`, `platforms`, `status`) are not translated — their labels
live in `data/i18n/`. Only `summary` and `legitimateUse` are written per language.

## Deploy

GitHub Pages → *Settings → Pages → Deploy from a branch → main / root*.
