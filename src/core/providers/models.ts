/**
 * The rules a provider's model list keeps.
 *
 * A provider holds a list of models and one default. The two are kept in step
 * here rather than at each call site: the default is always on the list when
 * the list has anything on it, names are trimmed, and a name appears once.
 */

export interface ModelSet {
  /** The default. Empty only when the list is empty too. */
  model: string;
  models: string[];
}

/**
 * Repair a stored pair. Returns `null` when the input is already sound, so the
 * caller can keep its original reference — storage writes back only on change.
 *
 * A store from before the list existed has a `model` and no `models`; that
 * model becomes a one-item list.
 */
export function normalizeModelSet(model: unknown, models: unknown): ModelSet | null {
  const listIn = Array.isArray(models) ? models : [];
  const list: string[] = [];
  for (const entry of listIn) {
    if (typeof entry !== 'string') continue;
    const name = entry.trim();
    if (name && !list.includes(name)) list.push(name);
  }

  let def = typeof model === 'string' ? model.trim() : '';
  if (def && !list.includes(def)) list.unshift(def);
  if (!def) def = list[0] ?? '';

  const sound =
    Array.isArray(models) &&
    model === def &&
    models.length === list.length &&
    models.every((m, i) => m === list[i]);
  return sound ? null : { model: def, models: list };
}

/** Add a model, keeping the default unless there was none. */
export function addModel(set: ModelSet, name: string): ModelSet {
  const trimmed = name.trim();
  if (!trimmed || set.models.includes(trimmed)) return set;
  const models = [...set.models, trimmed];
  return { model: set.model || trimmed, models };
}

/**
 * Remove a model. Removing the default hands the role to the first model left,
 * so a provider with models never ends up with no default.
 */
export function removeModel(set: ModelSet, name: string): ModelSet {
  if (!set.models.includes(name)) return set;
  const models = set.models.filter((m) => m !== name);
  const model = set.model === name ? (models[0] ?? '') : set.model;
  return { model, models };
}

/** Make an existing model the default. */
export function setDefaultModel(set: ModelSet, name: string): ModelSet {
  if (!set.models.includes(name) || set.model === name) return set;
  return { model: name, models: set.models };
}

/**
 * Which model a route actually uses: the one it names, while that one is still
 * on the provider's list; otherwise the provider's default. A route naming a
 * model the user has since removed must not keep sending it.
 */
export function effectiveModel(set: ModelSet, wanted: string | undefined): string {
  return wanted && set.models.includes(wanted) ? wanted : set.model;
}
