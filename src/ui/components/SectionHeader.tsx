interface Props {
  number: string;       // "01"
  label: string;        // "API"
  description?: string;
}

export function SectionHeader({ number, label, description }: Props) {
  return (
    <div class="flex items-baseline gap-3 mb-3 min-w-0">
      <span class="font-mono text-xs text-ap-subtle tracking-wider whitespace-nowrap">{number}</span>
      <span class="font-mono text-xs text-ap-fg uppercase tracking-wider font-medium whitespace-nowrap">{label}</span>
      <span class="flex-1 border-t border-ap-border min-w-[24px]" />
      {description && (
        <span class="text-xs text-ap-subtle whitespace-nowrap">{description}</span>
      )}
    </div>
  );
}
