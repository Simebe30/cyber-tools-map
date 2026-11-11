import { t } from "../i18n.js";

/** Header controls: search box, language, branch mode, theme toggle. */
export function renderControls(store) {
  const { locale, locales, theme, branchMode, query } = store.get();

  const el = document.createElement("div");
  el.className = "controls";
  el.innerHTML = `
    <input class="field search" type="search"
           value="${escapeAttr(query)}"
           placeholder="${t(locale, "app.searchPlaceholder")}"
           aria-label="${t(locale, "app.searchLabel")}" />
    <div class="segmented" role="group" aria-label="${t(locale, "controls.branchMode")}">
      ${locales
        .map(
          (loc) =>
            `<button type="button" class="segmented__btn" data-locale="${loc}"
                     aria-pressed="${loc === locale}">${loc.toUpperCase()}</button>`,
        )
        .join("")}
    </div>
    <div class="segmented" role="group" aria-label="${t(locale, "controls.branchMode")}">
      <button type="button" class="segmented__btn" data-branch="single"
              aria-pressed="${branchMode === "single"}">${t(locale, "controls.branchSingle")}</button>
      <button type="button" class="segmented__btn" data-branch="multi"
              aria-pressed="${branchMode === "multi"}">${t(locale, "controls.branchMulti")}</button>
    </div>
    <button type="button" class="icon-btn" data-theme-toggle
            aria-label="${t(locale, theme === "dark" ? "controls.toLight" : "controls.toDark")}">
      <svg class="icon"><use href="#icon-${theme === "dark" ? "sun" : "moon"}"></use></svg>
    </button>`;

  el.querySelector(".search").addEventListener("input", (e) =>
    store.set({ query: e.target.value }),
  );
  el.querySelectorAll("[data-locale]").forEach((btn) =>
    btn.addEventListener("click", () => store.set({ locale: btn.dataset.locale })),
  );
  el.querySelectorAll("[data-branch]").forEach((btn) =>
    btn.addEventListener("click", () => store.set({ branchMode: btn.dataset.branch })),
  );
  el.querySelector("[data-theme-toggle]").addEventListener("click", () =>
    store.set({ theme: theme === "dark" ? "light" : "dark" }),
  );

  return el;
}

const escapeAttr = (s) => s.replace(/"/g, "&quot;");
