"use client";

import { useMemo, useState } from "react";

import { Field } from "@/components/field";
import { cmToFeetInches, feetInchesToCm } from "@/lib/height";

type Unit = "cm" | "ft";

export function HeightField({
  cm,
  onChange,
  required = false,
}: {
  cm: string;
  onChange: (cm: string) => void;
  required?: boolean;
}) {
  const [unit, setUnit] = useState<Unit>("cm");
  const parsed = Number(cm);
  const imperial = useMemo(
    () => (parsed > 0 ? cmToFeetInches(parsed) : { feet: 0, inches: 0 }),
    [parsed],
  );

  function setFromImperial(feet: number, inches: number) {
    const nextInches = Math.min(11, Math.max(0, inches));
    const nextFeet = Math.max(0, feet);
    if (!nextFeet && !nextInches) {
      onChange("");
      return;
    }
    onChange(String(feetInchesToCm(nextFeet, nextInches)));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Height</p>
        <div className="grid grid-cols-2 rounded-full bg-sand p-0.5 text-xs font-semibold">
          {(["cm", "ft"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setUnit(item)}
              className={`rounded-full px-3 py-1 ${unit === item ? "bg-ink text-lime" : "text-muted"}`}
            >
              {item === "cm" ? "cm" : "ft / in"}
            </button>
          ))}
        </div>
      </div>
      {unit === "cm" ? (
        <input
          type="number"
          min={50}
          max={250}
          step="0.1"
          required={required}
          value={cm}
          onChange={(event) => onChange(event.target.value)}
          className="field"
          placeholder="175"
          aria-label="Height in centimetres"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Feet">
            <input
              type="number"
              min={1}
              max={8}
              required={required}
              value={imperial.feet || ""}
              onChange={(event) => setFromImperial(Number(event.target.value) || 0, imperial.inches)}
              className="field"
              placeholder="5"
            />
          </Field>
          <Field label="Inches">
            <input
              type="number"
              min={0}
              max={11}
              required={required}
              value={cm ? imperial.inches : ""}
              onChange={(event) => setFromImperial(imperial.feet, Number(event.target.value) || 0)}
              className="field"
              placeholder="9"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
