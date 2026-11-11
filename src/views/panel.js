import { t, localized } from "../i18n.js";

/** Renders the detail panel for the selected tool, or an empty hint. */
export function renderPanel(store, data) {
  const { locale, selectedToolId } = store.get();
  const el = document.createElement("aside");
  el.className = "panel";
  el.setAttribute("aria-label", t(locale, "app.relatedTitle"));

  const tool = data.toolsById.get(selectedToolId);
  if (!tool) {
    el.classList.add("panel--empty");
    el.textContent = t(locale, "app.emptyPanel");
    return el;
  }

  const zone = data.zoneOf(tool.category);
  const accent = data.taxonomy.zones[zone].accent;
  el.style.setProperty("--zone", accent);
  const text = localized(tool, locale);

  el.innerHTML = `
    <div class="panel__top">
      <div>
        <span class="panel__crumb">${t(locale, `category.${tool.category}`)} ·
          ${t(locale, `subcategory.${tool.subcategory}`)}</span>
        <h2 class="panel__name">${tool.name}</h2>
      </div>
      <button type="button" class="icon-btn" data-close
              aria-label="${t(locale, "app.closePanel")}">
        <svg class="icon"><use href="#icon-close"></use></svg>
      </button>
    </div>

    <div class="badges">
      <span class="badge badge--zone">${t(locale, `zone.${zone}`)}</span>
      <span class="badge">${t(locale, `license.${tool.license}`)}</span>
      ${tool.platforms.map((p) => `<span class="badge">${t(locale, `platform.${p}`)}</span>`).join("")}
      <span class="badge">${t(locale, `level.${tool.level}`)}</span>
    </div>

    <p class="panel__summary">${text.summary}</p>

    <div class="callout">
      <span class="callout__label">${t(locale, "app.legitimateUseTitle")}</span>
      <p style="margin:var(--space-2) 0 0">${text.legitimateUse}</p>
    </div>

    <dl class="meta">
      <div><dt>${t(locale, "field.status")}</dt><dd>${t(locale, `status.${tool.status}`)}</dd></div>
      <div><dt>${t(locale, "field.osiLayer")}</dt>
        <dd>${tool.osiLayer ?? t(locale, "na")}</dd></div>
    </dl>

    <a class="panel__cta" href="${tool.url}" target="_blank" rel="noopener noreferrer">
      ${t(locale, "app.openTool")}
      <svg class="icon"><use href="#icon-external"></use></svg>
    </a>`;

  el.querySelector("[data-close]").addEventListener("click", () =>
    store.set({ selectedToolId: null }),
  );
  return el;
}
