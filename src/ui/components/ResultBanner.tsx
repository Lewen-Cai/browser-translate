import { cn } from '~/lib/cn';

/** Bordered success/error feedback line for file-import style operations. */
export function ResultBanner({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p
      class={cn(
        'text-xs px-3 py-2 rounded-md border',
        ok
          ? 'text-ap-success border-ap-success/30 bg-ap-success/5'
          : 'text-ap-danger border-ap-danger/30 bg-ap-danger/5',
      )}
    >
      {text}
    </p>
  );
}
