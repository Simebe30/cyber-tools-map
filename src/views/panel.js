import { t, localized } from "../i18n.js";
import { annotate } from "../glossary.js";

/**
 * Detail panel for the selected tool.
 *
 * Reads the selected tool from the store and builds its card: breadcrumb,
 * badges, summary, legitimate-use example, optional price, a small facts grid
 * and a link to the official site. When nothing is selected it shows a hint.
 *
 * The three free-text blocks (summary, legitimate use, price) are run through
 * `annotate` so any glossary term inside them becomes a tooltip.
 */
export function renderPanel(store, data) {
  const { locale, selectedToolId } = store.get();

  const el = document.createElement("aside");
  el.className = "panel";
  el.setAttribute("aria-label", t(locale, "app.relatedTitle"));

  // Empty state: no tool chosen yet.
  const tool = data.toolsById.get(selectedToolId);
  if (!tool) {
    el.classList.add("panel--empty");
    el.textContent = t(locale, "app.emptyPanel");
    return el;
  }

  // Tint the panel with its zone colour (via the --zone CSS variable).
  const zone = data.zoneOf(tool.category);
  const accent = data.taxonomy.zones[zone].accent;
  el.style.setProperty("--zone", accent);

  // The free text in the active language (English as fallback).
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

    <!-- Badges: zone, licence, every platform, level, and GitHub when it applies -->
    <div class="badges">
      <span class="badge badge--zone">${t(locale, `zone.${zone}`)}</span>
      <span class="badge">${t(locale, `license.${tool.license}`)}</span>
      ${tool.platforms.map((p) => `<span class="badge">${t(locale, `platform.${p}`)}</span>`).join("")}
      <span class="badge">${t(locale, `level.${tool.level}`)}</span>
      ${tool.github ? '<span class="badge">GitHub</span>' : ""}
    </div>

    <!-- Free-text blocks: annotate() turns glossary terms into tooltips -->
    <p class="panel__summary">${annotate(data.glossary, text.summary, locale)}</p>

    <div class="callout">
      <span class="callout__label">${t(locale, "app.legitimateUseTitle")}</span>
      <p style="margin:var(--space-2) 0 0">${annotate(data.glossary, text.legitimateUse, locale)}</p>
    </div>

    <!-- Price block only exists for freemium / paid tools -->
    ${text.price
      ? `<div class="callout">
           <span class="callout__label">${t(locale, "app.pricingTitle")}</span>
           <p style="margin:var(--space-2) 0 0">${annotate(data.glossary, text.price, locale)}</p>
         </div>`
      : ""}

    <!-- Facts grid. "Applies to" only shows when the tool declares it -->
    <dl class="meta">
      ${tool.appliesTo ? `<div><dt>${t(locale, "field.appliesTo")}</dt>
        <dd>${tool.appliesTo.map((a) => t(locale, `applies.${a}`)).join(", ")}</dd></div>` : ""}
      <div><dt>${t(locale, "field.status")}</dt><dd>${t(locale, `status.${tool.status}`)}</dd></div>
      <div><dt>${t(locale, "field.osiLayer")}</dt>
        <dd>${tool.osiLayer ?? t(locale, "na")}</dd></div>
      <div><dt>${t(locale, "field.verified")}</dt>
        <dd><time datetime="${tool.verifiedAt}">${tool.verifiedAt}</time></dd></div>
    </dl>

    <!-- rel="noopener noreferrer" hardens the external link against tab-nabbing -->
    <a class="panel__cta" href="${tool.url}" target="_blank" rel="noopener noreferrer">
      ${t(locale, "app.openTool")}
      <svg class="icon"><use href="#icon-external"></use></svg>
    </a>`;

  // Close button clears the selection; the panel then falls back to its hint.
  el.querySelector("[data-close]").addEventListener("click", () =>
    store.set({ selectedToolId: null }),
  );

  return el;
}
