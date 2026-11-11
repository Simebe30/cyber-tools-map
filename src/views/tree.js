import { t } from "../i18n.js";

/**
 * Renders the category -> subcategory -> tool tree.
 * Open/closed state and the selected tool live in the store; this view only
 * reads them and emits intents, so the DOM is always a function of state.
 */
export function renderTree(store, data) {
  const { taxonomy, toolsBySub } = data;
  const { locale, openCategories, openSubcategories } = store.get();

  const tree = document.createElement("div");
  tree.className = "tree";

  for (const cat of taxonomy.categories) {
    const accent = taxonomy.zones[cat.zone].accent;
    const isOpen = openCategories.has(cat.id);

    const node = document.createElement("div");
    node.className = "category";
    node.style.setProperty("--zone", accent);
    node.dataset.open = isOpen;

    const toolCount = cat.subcategories.reduce(
      (n, s) => n + (toolsBySub.get(subKey(cat.id, s.id))?.length ?? 0),
      0,
    );

    node.innerHTML = `
      <button type="button" class="category__head" aria-expanded="${isOpen}">
        <svg class="icon category__icon"><use href="#icon-${cat.icon}"></use></svg>
        <span style="flex:1">${t(locale, `category.${cat.id}`)}</span>
        <span class="category__count">${toolCount}</span>
        <svg class="icon category__chevron" viewBox="0 0 14 14" fill="none"
             stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M3 5 L7 9 L11 5"/></svg>
      </button>
      <div class="category__body"></div>`;

    node.querySelector(".category__head").addEventListener("click", () =>
      toggleCategory(store, cat.id),
    );

    const body = node.querySelector(".category__body");
    for (const sub of cat.subcategories) {
      body.appendChild(renderSubcategory(store, data, cat, sub, accent));
    }
    tree.appendChild(node);
  }
  return tree;
}

function renderSubcategory(store, data, cat, sub, accent) {
  const { locale, openSubcategories } = store.get();
  const key = subKey(cat.id, sub.id);
  const tools = data.toolsBySub.get(key) ?? [];
  const isOpen = openSubcategories.has(key);

  const node = document.createElement("div");
  node.className = "subcategory";
  node.dataset.open = isOpen;
  node.style.setProperty("--zone", accent);
  node.innerHTML = `
    <button type="button" class="subcategory__head" aria-expanded="${isOpen}">
      <span>${t(locale, `subcategory.${sub.id}`)}</span>
      <span aria-hidden="true">${isOpen ? "–" : "+"}</span>
    </button>
    <div class="subcategory__tools"></div>`;

  node.querySelector(".subcategory__head").addEventListener("click", () =>
    toggleSubcategory(store, key),
  );

  const list = node.querySelector(".subcategory__tools");
  for (const tool of tools) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-link";
    btn.innerHTML = `
      <span class="tool-link__name">${tool.name}</span>
      ${tool.flagship ? '<span class="tool-link__flag">★</span>' : ""}`;
    btn.addEventListener("click", () => store.set({ selectedToolId: tool.id }));
    list.appendChild(btn);
  }
  return node;
}

/* ---- intents ---- */

function toggleCategory(store, id) {
  const { openCategories, branchMode } = store.get();
  const next = new Set(branchMode === "single" ? [] : openCategories);
  openCategories.has(id) ? next.delete(id) : next.add(id);
  store.set({ openCategories: next });
}

function toggleSubcategory(store, key) {
  const { openSubcategories } = store.get();
  const next = new Set(openSubcategories);
  next.has(key) ? next.delete(key) : next.add(key);
  store.set({ openSubcategories: next });
}

export const subKey = (catId, subId) => `${catId}/${subId}`;
