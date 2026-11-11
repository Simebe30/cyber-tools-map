import { createStore } from "./state.js";
import { loadLocales, t } from "./i18n.js";
import { buildIndex } from "./search.js";
import { renderControls } from "./views/controls.js";
import { renderTree, subKey } from "./views/tree.js";
import { renderPanel } from "./views/panel.js";

const LOCALES = ["es", "en"];
const DEFAULT_LOCALE = "es";

async function boot() {
  const [taxonomy, tools] = await Promise.all([
    fetch("data/taxonomy.json").then((r) => r.json()),
    fetch("data/tools.json").then((r) => r.json()),
    loadLocales(LOCALES),
  ]);

  // Derived lookups, computed once.
  const toolsById = new Map(tools.map((tl) => [tl.id, tl]));
  const toolsBySub = new Map();
  for (const tl of tools) {
    const key = subKey(tl.category, tl.subcategory);
    if (!toolsBySub.has(key)) toolsBySub.set(key, []);
    toolsBySub.get(key).push(tl);
  }
  const zoneByCategory = new Map(
    taxonomy.categories.map((c) => [c.id, c.zone]),
  );

  const data = {
    taxonomy,
    toolsById,
    toolsBySub,
    index: buildIndex(tools, LOCALES, (tool, loc) => [
      t(loc, `category.${tool.category}`),
      t(loc, `subcategory.${tool.subcategory}`),
    ]),
    zoneOf: (categoryId) => zoneByCategory.get(categoryId),
  };

  const store = createStore({
    locale: DEFAULT_LOCALE,
    locales: LOCALES,
    theme: "dark",
    branchMode: "single",
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

  store.subscribe((state) => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.locale;
    render(store, data, mounts);
  });

  render(store, data, mounts);
  document.documentElement.dataset.theme = "dark";
}

function render(store, data, mounts) {
  const { locale } = store.get();
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(locale, node.dataset.i18n);
  }
  replace(mounts.controls, renderControls(store));
  replace(mounts.tree, renderTree(store, data));
  replace(mounts.panel, renderPanel(store, data));
}

/** Swap a mount point's single child without losing the container. */
function replace(mount, node) {
  mount.replaceChildren(node);
}

boot().catch((err) => {
  console.error(err);
  document.getElementById("tree").textContent =
    "No se pudieron cargar los datos. Sirve el proyecto con un servidor local.";
});
