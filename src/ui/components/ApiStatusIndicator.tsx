import { useEffect, useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { useAppStore } from '~/storage/store';
import { pingApi } from '~/messaging/client';
import type { PingResponse } from '~/messaging/types';
import { deriveStatus, type PingValue, type StatusState } from '~/ui/statusDerivation';
import { useT } from '~/i18n';
import type { StringKey } from '~/i18n/strings';

type TFn = (key: StringKey) => string;

interface Props {
  /**
   * Increment to trigger a fresh ping. Popup increments after Save commits.
   * Options page increments after a debounced edit.
   */
  pingNonce: number;
  /** Skip the auto-ping (used during initial popup load when fields are still empty). */
  skip?: boolean;
}

export function ApiStatusIndicator({ pingNonce, skip = false }: Props): JSX.Element {
  const api = useAppStore((s) => s.data.api);
  const engine = useAppStore((s) => s.data.settings.engine);
  const t = useT();
  const [ping, setPing] = useState<PingValue>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (skip) {
      setPing(null);
      return;
    }
    const mine = ++seq.current;
    setPing('pending');
    pingApi().then((r: PingResponse) => {
      if (mine !== seq.current) return;
      setPing(r);
    });
  }, [pingNonce, skip, engine]);

  const state = deriveStatus(api, ping, engine);
  const { dotClass, label } = render(state, t);

  return (
    <div
      class="flex items-center gap-2"
      title={tooltipFor(state)}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span class="text-2xs font-mono uppercase tracking-wider text-ap-muted">
        {label}
      </span>
      {state.kind === 'ready' && (
        <span class="text-2xs font-mono text-ap-subtle">{state.latencyMs}ms</span>
      )}
    </div>
  );
}

function render(state: StatusState, t: TFn): { dotClass: string; label: string } {
  switch (state.kind) {
    case 'not-configured':
      return { dotClass: 'bg-ap-subtle', label: t('notConfigured').toUpperCase() };
    case 'checking':
      return { dotClass: 'bg-amber-500 animate-pulse', label: t('statusChecking').toUpperCase() };
    case 'ready':
      return { dotClass: 'bg-ap-success', label: t('ready').toUpperCase() };
    case 'model-missing':
      return { dotClass: 'bg-amber-500', label: t('statusModelMissing').toUpperCase() };
    case 'offline':
      return { dotClass: 'bg-ap-danger', label: t('statusOffline').toUpperCase() };
  }
}

function tooltipFor(state: StatusState): string | undefined {
  if (state.kind === 'offline') {
    return state.status ? `${state.status} · ${state.message}` : state.message;
  }
  if (state.kind === 'model-missing') {
    const list = state.availableModels.slice(0, 8).join(', ');
    return `${state.configuredModel} not in list. Available: ${list}${state.availableModels.length > 8 ? ' …' : ''}`;
  }
  return undefined;
}
