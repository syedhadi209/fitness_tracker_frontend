export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      {hint ? <span className="ml-1 font-normal text-muted">{hint}</span> : null}
      <div className="mt-1.5 text-ink">{children}</div>
    </label>
  );
}
