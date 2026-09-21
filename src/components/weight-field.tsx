"use client";

import { useMemo, useState } from "react";

import { kgToLb, lbToKg } from "@/lib/weight";

type Unit = "kg" | "lb";

export function WeightField({
  kg,
  onChange,
  required = false,
  label = "Current weight",
  hint,
}: {
  kg: string;
  onChange: (kg: string) => void;
  required?: boolean;
  label?: string;
  hint?: string;
}) {
  const [unit, setUnit] = useState<Unit>("kg");
  const parsed = Number(kg);
  const pounds = useMemo(() => (parsed > 0 ? kgToLb(parsed) : 0), [parsed]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          {label}
          {hint ? <span className="ml-1 font-normal text-muted">{hint}</span> : null}
        </p>
        <div className="grid grid-cols-2 rounded-full bg-sand p-0.5 text-xs font-semibold">
          {(["kg", "lb"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setUnit(item)}
              className={`rounded-full px-3 py-1 ${unit === item ? "bg-night text-lime" : "text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {unit === "kg" ? (
        <input
          type="number"
          min={20}
          max={400}
          step="0.1"
          required={required}
          value={kg}
          onChange={(event) => onChange(event.target.value)}
          className="field"
          placeholder="72"
          aria-label={`${label} in kilograms`}
        />
      ) : (
        <input
          type="number"
          min={44}
          max={880}
          step="0.1"
          required={required}
          value={kg ? pounds : ""}
          onChange={(event) => {
            const lb = Number(event.target.value);
            onChange(lb ? String(lbToKg(lb)) : "");
          }}
          className="field"
          placeholder="158"
          aria-label={`${label} in pounds`}
        />
      )}
    </div>
  );
}
