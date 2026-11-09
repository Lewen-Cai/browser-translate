import type { LucideIcon } from 'lucide-preact';

interface Props {
  label: string;
  description?: string;
  /** A Lucide glyph, drawn in a tinted square before the title. */
  icon?: LucideIcon;
}

export function SectionHeader({ label, description, icon: Icon }: Props) {
  return (
    <div class="mb-4 flex min-w-0 items-start gap-3">
      {Icon && (
        <span class="mt-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ap-brand/10 text-ap-brand">
          <Icon size={16} />
        </span>
      )}
      <div class="min-w-0">
        <h2 class="text-base font-semibold leading-8 text-ap-fg">{label}</h2>
        {description && <p class="text-xs leading-relaxed text-ap-muted">{description}</p>}
      </div>
    </div>
  );
}
