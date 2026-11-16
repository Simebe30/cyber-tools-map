/**
 * Glossary module.
 *
 * Purpose: many tool summaries use network/security jargon (DNS, LLMNR, BPF...)
 * that the target audience — people in cyber who do not come from networking —
 * may not know. This module finds those terms inside any text and wraps each
 * one in a tooltip that shows a plain-language definition.
 *
 * The terms and their definitions live in data/glossary.json, so adding or
 * editing a term never requires touching this code.
 */

/**
 * Lower-cases and strips accents so matching is case- and accent-insensitive.
 * "BPF", "bpf" and a hypothetical "bpf" with an accent all collapse to the
 * same key, which is how we look a matched word up in the term map.
 */
const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Escapes a term before putting it inside a RegExp (e.g. the "-" in NBT-NS). */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Escapes text before injecting it as HTML, so the data can never break markup. */
const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/**
 * Compiles the glossary into a reusable matcher, built once at start-up.
 * Returns { regex, byKey } or null when there are no terms.
 */
export function buildGlossaryMatcher(terms) {
  if (!terms?.length) return null;

  // Map from normalized term -> its full entry, used to fetch the definition
  // after a match.
  const byKey = new Map(terms.map((t) => [normalize(t.term), t]));

  // Build one alternation ("DNS|LLMNR|..."). Longest first so that, for
  // example, "mDNS" is tried before "DNS" and wins the match.
  const alternation = terms
    .map((t) => t.term)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  // The look-behind/look-ahead `(?<![\w-])...(?![\w-])` act as word
  // boundaries that also respect hyphens, so "DNS" inside "mDNS" or "NBT-NS"
  // is NOT matched on its own — only whole standalone terms are.
  // The trailing `(s?)` lets a term match its simple English/Spanish plural
  // ("buckets", "pcaps") while the base term (group 1) is what we look up.
  // Flags: g (all matches), i (case-insensitive), u (unicode-safe).
  const regex = new RegExp(`(?<![\\w-])(${alternation})(s?)(?![\\w-])`, "giu");

  return { regex, byKey };
}

/**
 * Returns HTML for `text` with every glossary term wrapped in a tooltip span.
 *
 * Order matters: we escape the text FIRST and then insert our own spans, so the
 * data itself can never inject markup while our trusted spans still render.
 * (Terms contain no HTML-special characters, so escaping never alters them.)
 *
 * With no matcher (empty/missing glossary) it just returns the escaped text.
 */
export function annotate(matcher, text, locale) {
  const safe = escapeHtml(text);
  if (!matcher) return safe;

  return safe.replace(matcher.regex, (match, core) => {
    // Look up by the base term (group 1), so a plural like "buckets" still
    // resolves to the "bucket" entry while the whole word stays highlighted.
    const entry = matcher.byKey.get(normalize(core));
    if (!entry) return match; // defensive: should not happen

    // Definition in the active language, falling back to English.
    const def = escapeHtml(entry.i18n[locale] ?? entry.i18n.en ?? "");

    // role="button" + tabindex make the term reachable by keyboard; the
    // aria-label voices the definition for screen readers. The inner span is
    // the visual tooltip (shown via CSS on hover/focus/.open).
    return (
      `<span class="term" role="button" tabindex="0" aria-label="${def}">` +
      `${match}<span class="term__tip" role="tooltip">${def}</span></span>`
    );
  });
}
