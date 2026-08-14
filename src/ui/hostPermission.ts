import { PROVIDERS, type ProviderId } from '~/core/providers/registry';

/**
 * Ask for the host grant a provider needs, if it needs one.
 *
 * Call this straight from the click that switches a provider on: Chrome only
 * shows the prompt in response to a user gesture, and awaiting anything first
 * loses it. `request` is safe to call when the grant already exists — it
 * resolves true without prompting — so there is deliberately no `contains`
 * check in front of it.
 */
export function ensureHostPermission(id: ProviderId): Promise<boolean> {
  const pattern = PROVIDERS[id].hostPermission;
  if (!pattern) return Promise.resolve(true);
  return chrome.permissions.request({ origins: [pattern] });
}
