import type { ReactNode } from "react";
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="meter">
      <span>
        {label}
        <b>{Math.round(value)}</b>
      </span>
      <progress max={100} value={value} />
    </div>
  );
}
export const percent = (n: number) => `${Math.round(n)}%`;
