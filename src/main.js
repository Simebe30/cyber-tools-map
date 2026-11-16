/**
 * Application bootstrap.
 *
 * Flow: load the data files and locales, precompute the lookups the views need,
 * create the single state store, mount the three views, and re-render whenever
 * the state changes. Nothing here holds DOM state of its own — the DOM is always
 * a pure function of the store.
 */
import { createStore } from "./state.js";
import { loadLocales, t } from "./i18n.js";
import { buildIndex } from "./search.js";
import { buildGlossaryMatcher } from "./glossary.js";
import { renderControls } from "./views/controls.js";
import { renderTree, subKey } from "./views/tree.js";
import { renderPanel } from "./views/panel.js";

const LOCALES = ["es", "en"];
const DEFAULT_LOCALE = "es";

async function boot() {
  // Fetch everything in parallel. The glossary is optional: if the file is
  // missing or fails, we fall back to an empty list so the app still works.
  const [taxonomy, tools, glossaryTerms] = await Promise.all([
    fetch("data/taxonomy.json").then((r) => r.json()),
    fetch("data/tools.json").then((r) => r.json()),
    fetch("data/glossary.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    loadLocales(LOCALES), // resolves to undefined; only its side effect matters
  ]);

  // --- Derived lookups, computed once so the views never scan the arrays ---

  // Fast "id -> tool" access for the detail panel and related links.
  const toolsById = new Map(tools.map((tl) => [tl.id, tl]));

  // Group tools under "category/subcategory" so the tree can list each branch.
  const toolsBySub = new Map();
  for (const tl of tools) {
    const key = subKey(tl.category, tl.subcategory);
    if (!toolsBySub.has(key)) toolsBySub.set(key, []);
    toolsBySub.get(key).push(tl);
  }

  // Which zone (offensive / defensive / cross-cutting) each category belongs to.
  const zoneByCategory = new Map(
    taxonomy.categories.map((c) => [c.id, c.zone]),
  );

  // Everything the views read, bundled so we pass one object around.
  const data = {
    taxonomy,
    toolsById,
    toolsBySub,
    glossary: buildGlossaryMatcher(glossaryTerms),
    // The search index also includes the localized category/subcategory labels,
    // so searching "geolocalización" finds the tools under that subcategory.
    index: buildIndex(tools, LOCALES, (tool, loc) => [
      t(loc, `category.${tool.category}`),
      t(loc, `subcategory.${tool.subcategory}`),
    ]),
    zoneOf: (categoryId) => zoneByCategory.get(categoryId),
  };

  // Single source of truth. Views read it; interactions dispatch changes to it.
  const store = createStore({
    locale: DEFAULT_LOCALE,
    locales: LOCALES,
    theme: "dark",
    branchMode: "single", // "single" = opening a category closes the others
    query: "",
    openCategories: new Set(),
    openSubcategories: new Set(),
    selectedToolId: null,
  });

  const mounts = {
    controls: document.getElementById("controls"),
    tree: document.getElementById("tree"),
    panel: document.getElementById("panel"),
  };

  // Re-render on every state change, and keep <html> in sync for theme/lang
  // (CSS and screen readers read those attributes).
  store.subscribe((state) => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.locale;
    render(store, data, mounts);
  });

  render(store, data, mounts); // first paint
  document.documentElement.dataset.theme = "dark";
}

/** Rebuilds the three views from the current state. */
function render(store, data, mounts) {
  const { locale } = store.get();

  // Fill the static text nodes in index.html (subtitle, disclaimer) for the
  // active language.
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(locale, node.dataset.i18n);
  }

  replace(mounts.controls, renderControls(store));
  replace(mounts.tree, renderTree(store, data));
  replace(mounts.panel, renderPanel(store, data));
}

/** Swap a mount point's single child without losing the container element. */
function replace(mount, node) {
  mount.replaceChildren(node);
}

// Glossary tooltips: hover and keyboard focus are handled purely in CSS, but
// touch screens have no hover, so a tap must "pin" the tooltip open. One
// delegated listener covers every term, even after the panel re-renders:
// tapping a term toggles it; tapping anywhere else closes any open one.
document.addEventListener("click", (e) => {
  const term = e.target.closest(".term");
  document.querySelectorAll(".term.open").forEach((t) => {
    if (t !== term) t.classList.remove("open");
  });
  if (term) term.classList.toggle("open");
});

// If the data files cannot be loaded (e.g. opened as a file:// page instead of
// through a local server), show a clear message instead of a blank screen.
boot().catch((err) => {
  console.error(err);
  document.getElementById("tree").textContent =
    "No se pudieron cargar los datos. Sirve el proyecto con un servidor local.";
});
