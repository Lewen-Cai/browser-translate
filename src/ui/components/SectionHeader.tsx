interface Props {
  label: string;
  description?: string;
}

export function SectionHeader({ label, description }: Props) {
  return (
    <div class="mb-4 min-w-0">
      <h2 class="text-base font-semibold text-ap-fg">{label}</h2>
      {description && <p class="mt-1 text-xs leading-relaxed text-ap-muted">{description}</p>}
    </div>
  );
}
