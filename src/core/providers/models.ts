/**
 * The rules a provider's model list keeps.
 *
 * A provider holds a list of models. `model` is not something the user picks:
 * it is always the first model on the list, kept in step here. Routes name
 * their model explicitly; `model` is what a pre-v0.2.3 route is given on
 * upgrade, and what the connection check asks the endpoint about.
 */

export interface ModelSet {
  /** The first model on the list, or empty when the list is. */
  model: string;
  models: string[];
}

/**
 * Repair a stored pair. Returns `null` when the input is already sound, so the
 * caller can keep its original reference — storage writes back only on change.
 *
 * A store from before the list existed has a `model` and no `models`; that
 * model becomes a one-item list. A store from a v0.2.3 development build could
 * have marked a later model as the default; that one is moved to the front, so
 * the fallback it chose is the fallback it keeps.
 */
export function normalizeModelSet(model: unknown, models: unknown): ModelSet | null {
  const listIn = Array.isArray(models) ? models : [];
  const list: string[] = [];
  for (const entry of listIn) {
    if (typeof entry !== 'string') continue;
    const name = entry.trim();
    if (name && !list.includes(name)) list.push(name);
  }

  const preferred = typeof model === 'string' ? model.trim() : '';
  if (preferred) {
    const at = list.indexOf(preferred);
    if (at > 0) list.splice(at, 1);
    if (at !== 0) list.unshift(preferred);
  }
  const first = list[0] ?? '';

  const sound =
    Array.isArray(models) &&
    model === first &&
    models.length === list.length &&
    models.every((m, i) => m === list[i]);
  return sound ? null : { model: first, models: list };
}

/** Add a model to the end of the list. */
export function addModel(set: ModelSet, name: string): ModelSet {
  const trimmed = name.trim();
  if (!trimmed || set.models.includes(trimmed)) return set;
  const models = [...set.models, trimmed];
  return { model: models[0]!, models };
}

/** Remove a model. A route that used it becomes unconfigured (see routing). */
export function removeModel(set: ModelSet, name: string): ModelSet {
  if (!set.models.includes(name)) return set;
  const models = set.models.filter((m) => m !== name);
  return { model: models[0] ?? '', models };
}
