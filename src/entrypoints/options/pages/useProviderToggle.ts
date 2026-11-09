import { useState } from 'preact/hooks';
import { useAppStore } from '~/storage/store';
import { ensureHostPermission } from '~/ui/hostPermission';
import type { ProviderId } from '~/core/providers/registry';

/**
 * Switch a provider on or off by hand.
 *
 * Switching one on can need a host grant first, and the request has to leave
 * from inside the click — Chrome only prompts during a user gesture, and
 * awaiting anything beforehand loses it. `denied` names the provider whose
 * grant was refused, so the row can say why it did not switch on.
 */
export function useProviderToggle() {
  const updateProvider = useAppStore((s) => s.updateProvider);
  const [denied, setDenied] = useState<ProviderId | null>(null);

  function toggle(id: ProviderId, enabled: boolean) {
    if (!enabled) {
      setDenied((d) => (d === id ? null : d));
      void updateProvider(id, { enabled: false });
      return;
    }
    void ensureHostPermission(id).then((granted) => {
      setDenied(granted ? null : id);
      if (granted) void updateProvider(id, { enabled: true });
    });
  }

  return { toggle, denied };
}
