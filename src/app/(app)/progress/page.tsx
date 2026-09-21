"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, errorMessage } from "@/lib/api";
import { addDays, num, todayISO } from "@/lib/format";
import type { CalorieHistoryPoint, WeightHistoryPoint } from "@/lib/types";

export default function ProgressPage() {
  const end = todayISO();
  const start = addDays(end, -29);
  const [calories, setCalories] = useState<CalorieHistoryPoint[]>([]);
  const [weights, setWeights] = useState<WeightHistoryPoint[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.history({ start, end, metric: "calories" }),
      api.history({ start, end, metric: "weight" }),
    ])
      .then(([cal, weight]) => {
        setCalories(
          cal.results.map((row) => ({
            date: String(row.date),
            consumed: num(row.consumed),
            burned: num(row.burned),
            net: num(row.net),
            steps: num(row.steps),
          })),
        );
        setWeights(
          weight.results.map((row) => ({
            date: String(row.date),
            weight_kg: num(row.weight_kg),
            body_fat_pct: row.body_fat_pct == null ? null : num(row.body_fat_pct),
          })),
        );
      })
      .catch((err) => setError(errorMessage(err)));
  }, [start, end]);

  const avgConsumed = useMemo(() => {
    if (!calories.length) return 0;
    return Math.round(calories.reduce((sum, row) => sum + row.consumed, 0) / calories.length);
  }, [calories]);
  const latestWeight = weights[weights.length - 1];
  const firstWeight = weights[0];
  const delta =
    latestWeight && firstWeight ? latestWeight.weight_kg - firstWeight.weight_kg : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <p className="text-xs uppercase tracking-widest text-moss">Last 30 days</p>
      <h1 className="font-serif text-4xl">Progress</h1>
      {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Avg eaten" value={`${avgConsumed}`} suffix="kcal" />
        <Stat
          label="Weight"
          value={latestWeight ? latestWeight.weight_kg.toFixed(1) : "—"}
          suffix="kg"
        />
        <Stat
          label="Change"
          value={weights.length > 1 ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : "—"}
          suffix="kg"
        />
      </div>

      <section className="mt-6 rounded-[28px] bg-paper p-5">
        <h2 className="mb-4 font-serif text-xl">Calories in vs out</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={calories}>
              <CartesianGrid stroke="#e8dfcf" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="consumed" stroke="#e07a4a" fill="#e07a4a33" name="Eaten" />
              <Area type="monotone" dataKey="burned" stroke="#2f6a54" fill="#2f6a5433" name="Burned" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-paper p-5">
        <h2 className="mb-4 font-serif text-xl">Steps</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={calories}>
              <CartesianGrid stroke="#e8dfcf" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="steps" stroke="#3f9d8f" fill="#3f9d8f33" name="Steps" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-paper p-5">
        <h2 className="mb-4 font-serif text-xl">Weight</h2>
        {weights.length < 2 ? (
          <p className="text-sm text-muted">Log a couple of weigh-ins to see the trend.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weights}>
                <CartesianGrid stroke="#e8dfcf" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="weight_kg" stroke="#12261c" strokeWidth={2} dot name="kg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-[24px] bg-paper p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="font-serif text-3xl">
        {value}
        <span className="ml-1 text-base text-muted">{suffix}</span>
      </p>
    </div>
  );
}

function shortDate(value: string) {
  const parts = value.split("-");
  return `${parts[1]}/${parts[2]}`;
}
