/**
 * Minimal observable store. Single source of truth for the whole app.
 * Views subscribe to changes; nothing mutates `state` directly.
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    /** Shallow-merge a patch and notify subscribers. */
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
