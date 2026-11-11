/**
 * Loads locale dictionaries and resolves dotted keys, e.g. t("app.title").
 * Free text that lives on each tool (summary, legitimateUse) is read with
 * localized(tool, locale) instead.
 */
const DICTS = {};

export async function loadLocales(locales) {
  await Promise.all(
    locales.map(async (loc) => {
      const res = await fetch(`data/i18n/${loc}.json`);
      if (!res.ok) throw new Error(`Missing locale: ${loc}`);
      DICTS[loc] = await res.json();
    }),
  );
}

/** Resolve "a.b.c" against the active locale; returns the key itself if missing. */
export function t(locale, key, vars) {
  const raw = key.split(".").reduce((node, part) => node?.[part], DICTS[locale]);
  if (raw == null) return key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

/** Localized free text block for a tool, with English as the fallback. */
export function localized(tool, locale) {
  return tool.i18n[locale] ?? tool.i18n.en;
}
