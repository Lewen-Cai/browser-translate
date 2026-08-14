import { useEffect, useState, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { useAppStore } from '~/storage/store';
import { pingApi } from '~/messaging/client';
import type { PingResponse } from '~/messaging/types';
import { deriveStatus, type PingValue, type StatusState } from '~/ui/statusDerivation';
import { useT } from '~/i18n';
import type { ProviderId } from '~/core/providers/registry';
import type { StringKey } from '~/i18n/strings';

type TFn = (key: StringKey) => string;

interface Props {
  /** Which provider this reports on. Each is probed on its own. */
  provider: ProviderId;
  /**
   * Increment to trigger a fresh ping. Left at its default the indicator still
   * probes once when it appears, which is what a row being opened wants.
   */
  pingNonce?: number;
  /** Skip the auto-ping (used during initial popup load when fields are still empty). */
  skip?: boolean;
  /**
   * Drop the state word while everything is fine, leaving the dot and the
   * latency. Somewhere tight — a list row, a panel header — the number is the
   * whole point and "READY" beside it is noise. Anything other than ready still
   * says what it is, because a coloured dot alone does not explain itself.
   */
  compact?: boolean;
}

export function ApiStatusIndicator({
  provider,
  pingNonce = 0,
  skip = false,
  compact = false,
}: Props): JSX.Element {
  const cfg = useAppStore((s) => s.data.providers[provider]);
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
    pingApi(provider).then((r: PingResponse) => {
      if (mine !== seq.current) return;
      setPing(r);
    });
  }, [pingNonce, skip, provider]);

  const state = deriveStatus(provider, cfg, ping);
  const { dotClass, label } = render(state, t);
  // A probe in flight says nothing useful in compact form — the pulsing dot
  // already carries it, and a word that appears for a moment and vanishes reads
  // as a glitch.
  const showLabel = !compact || (state.kind !== 'ready' && state.kind !== 'checking');

  return (
    <div class="flex items-center gap-1.5" title={tooltipFor(state)}>
      <span class={`w-1.5 h-1.5 shrink-0 rounded-full ${dotClass}`} />
      {showLabel && (
        <span class="text-2xs font-mono uppercase tracking-wider text-ap-muted">{label}</span>
      )}
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
