import { localized } from "./i18n.js";

/**
 * Builds a search index over tools and queries it by name, tags, the localized
 * summary/use text and any extra terms the caller supplies (e.g. the localized
 * category and subcategory labels, so "geolocalización" finds its tools).
 * Matching is accent-insensitive substring, enough for a catalogue this size.
 */
const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function buildIndex(tools, locales, extraTerms = () => []) {
  return tools.map((tool) => {
    const parts = [tool.name, tool.id, ...tool.tags];
    for (const loc of locales) {
      const text = tool.i18n[loc];
      if (text) parts.push(text.summary, text.legitimateUse);
      parts.push(...extraTerms(tool, loc));
    }
    return { tool, haystack: normalize(parts.join(" ")) };
  });
}

/** Returns matching tools, preserving the index order. */
export function search(index, query) {
  const needle = normalize(query.trim());
  if (!needle) return [];
  return index.filter((entry) => entry.haystack.includes(needle)).map((e) => e.tool);
}
