"use client";

import { useMemo, useState } from "react";

type Unit = "weeks" | "months";

const WEEKS_PER_MONTH = 4;

export function weeksToMonths(weeks: number): number {
  return Math.round((weeks / WEEKS_PER_MONTH) * 10) / 10;
}

export function monthsToWeeks(months: number): number {
  return Math.max(1, Math.round(months * WEEKS_PER_MONTH));
}

export function GoalDurationField({
  weeks,
  onChange,
  required = false,
}: {
  weeks: string;
  onChange: (weeks: string) => void;
  required?: boolean;
}) {
  const [unit, setUnit] = useState<Unit>("weeks");
  const parsed = Number(weeks);
  const months = useMemo(() => (parsed > 0 ? weeksToMonths(parsed) : 0), [parsed]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">
          Reach it in
          <span className="ml-1 font-normal text-muted">how long to hit your goal weight</span>
        </p>
        <div className="grid grid-cols-2 rounded-full bg-sand p-0.5 text-xs font-semibold">
          {(["weeks", "months"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setUnit(item)}
              className={`rounded-full px-3 py-1 ${unit === item ? "bg-ink text-lime" : "text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {unit === "weeks" ? (
        <input
          type="number"
          min={1}
          max={104}
          step="1"
          required={required}
          value={weeks}
          onChange={(event) => onChange(event.target.value)}
          className="field"
          placeholder="12"
          aria-label="Goal timeline in weeks"
        />
      ) : (
        <input
          type="number"
          min={1}
          max={24}
          step="0.5"
          required={required}
          value={weeks ? months : ""}
          onChange={(event) => {
            const value = Number(event.target.value);
            onChange(value ? String(monthsToWeeks(value)) : "");
          }}
          className="field"
          placeholder="3"
          aria-label="Goal timeline in months"
        />
      )}
    </div>
  );
}
