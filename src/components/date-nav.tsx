"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, formatDay, todayISO } from "@/lib/format";

export function DateNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (next: string) => void;
}) {
  const today = todayISO();
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(addDays(date, -1))}
        className="rounded-full p-2 hover:bg-sand"
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center">
        <p className="font-serif text-2xl tracking-tight">{formatDay(date)}</p>
        {date !== today ? (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="text-xs font-medium text-moss"
          >
            Jump to today
          </button>
        ) : (
          <p className="text-xs text-muted">Your day so far</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(addDays(date, 1))}
        disabled={date >= today}
        className="rounded-full p-2 hover:bg-sand disabled:opacity-30"
        aria-label="Next day"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
