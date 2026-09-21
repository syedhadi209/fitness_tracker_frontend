"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Footprints, MessageCircle, Plus, Scale } from "lucide-react";

import { LogSheet } from "@/components/log-sheet";
import { MacroBar, Ring } from "@/components/rings";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, errorMessage } from "@/lib/api";
import { kcal, num, todayISO } from "@/lib/format";
import { useClientReady } from "@/lib/use-client-ready";
import type { Dashboard, StepLog, WeightLog } from "@/lib/types";

export default function DashboardPage() {
  const ready = useClientReady();
  const [date, setDate] = useState("");
  const [data, setData] = useState<Dashboard | null>(null);
  const [stepLog, setStepLog] = useState<StepLog | null>(null);
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null);
  const [stepsInput, setStepsInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!date) return;
    setError("");
    try {
      const [dash, stepPage, weightPage] = await Promise.all([
        api.dashboard(date),
        api.steps(date),
        api.weights(),
      ]);
      setData(dash);
      const steps = stepPage.results[0] ?? null;
      setStepLog(steps);
      setStepsInput(steps ? String(steps.steps) : "");
      const todayWeight = weightPage.results.find((item) => item.date === date) ?? null;
      setWeightLog(todayWeight);
      const latestKg = todayWeight?.weight_kg ?? dash.weight_kg;
      setWeightInput(latestKg != null ? String(latestKg) : "");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [date]);

  useEffect(() => {
    setDate(todayISO());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const calorieTarget = data?.targets.calories ?? null;
  const consumed = num(data?.consumed.calories);
  const remaining = data?.calories_remaining;
  const missingWeight = data != null && data.weight_kg == null;

  const proteinTarget = useMemo(() => {
    if (data?.targets.protein_g) return data.targets.protein_g;
    if (calorieTarget) return Math.round((calorieTarget * 0.3) / 4);
    return null;
  }, [data, calorieTarget]);
  const carbsTarget = data?.targets.carbs_g ?? (calorieTarget ? Math.round((calorieTarget * 0.4) / 4) : null);
  const fatTarget = data?.targets.fat_g ?? (calorieTarget ? Math.round((calorieTarget * 0.3) / 9) : null);

  if (!ready || !date) {
    return <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8" />;
  }

  async function saveSteps() {
    const steps = Number(stepsInput);
    if (!steps) return;
    await api.setSteps({ date, steps });
    load();
  }

  async function saveWeight() {
    const weight = Number(weightInput);
    if (!weight) return;
    if (weightLog) await api.updateWeight(weightLog.id, { weight_kg: weight, date });
    else await api.upsertWeight({ date, weight_kg: weight });
    load();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">Today</h1>
          <p className="text-sm text-muted">Your numbers so far</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <Link
            href="/chat"
            className="btn-ghost inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold"
          >
            <MessageCircle size={14} /> Trainer
          </Link>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold"
          >
            <Plus size={14} /> Log
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-ember">{error}</p> : null}
      {missingWeight ? (
        <p className="mt-4 rounded-[24px] bg-paper p-4 text-sm">
          Log your current weight so we can calculate maintenance calories and exercise burn.
        </p>
      ) : null}

      <section className="mt-6 rounded-[32px] bg-forest p-6 text-foam shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Ring value={consumed} max={calorieTarget ?? 0}>
            <p className="font-serif text-4xl text-lime">{Math.round(consumed)}</p>
            <p className="text-xs text-foam/70">
              {calorieTarget != null ? `of ${calorieTarget} kcal` : "no target yet"}
            </p>
          </Ring>
          <div className="w-full flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-lime/80">Remaining</p>
              <p className="font-serif text-4xl text-lime">
                {remaining == null ? "—" : Math.round(num(remaining))}
              </p>
              <p className="text-sm text-foam/70">
                Burned {kcal(data?.burned.total)} · net {kcal(data?.net_calories)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-foam/60">Exercise</p>
                <p className="font-medium">{kcal(data?.burned.exercise)}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-foam/60">Steps</p>
                <p className="font-medium">
                  {data?.burned.step_count.toLocaleString()} · {kcal(data?.burned.steps)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-paper p-5">
        <h2 className="mb-4 font-serif text-xl">Macros</h2>
        <div className="space-y-4">
          <MacroBar label="Protein" value={num(data?.consumed.protein_g)} target={proteinTarget} color="#2f6a54" />
          <MacroBar label="Carbs" value={num(data?.consumed.carbs_g)} target={carbsTarget} color="#e07a4a" />
          <MacroBar label="Fat" value={num(data?.consumed.fat_g)} target={fatTarget} color="#3f9d8f" />
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveSteps();
          }}
          className="rounded-[28px] bg-paper p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Footprints size={16} /> Steps today
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={stepsInput}
              onChange={(event) => setStepsInput(event.target.value)}
              placeholder="8000"
              className="w-full rounded-2xl bg-cream px-3 py-2"
            />
            <button type="submit" className="btn-solid rounded-2xl px-4 font-semibold">
              Save
            </button>
          </div>
          {stepLog ? (
            <p className="mt-2 text-xs text-muted">Burned {kcal(stepLog.calories_burned)}</p>
          ) : null}
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveWeight();
          }}
          className="rounded-[28px] bg-paper p-5"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Scale size={16} /> Weight (kg)
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(event) => setWeightInput(event.target.value)}
              placeholder="80.4"
              className="w-full rounded-2xl bg-cream px-3 py-2"
            />
            <button type="submit" className="btn-solid rounded-2xl px-4 font-semibold">
              Save
            </button>
          </div>
        </form>
      </div>

      <Link
        href="/progress"
        className="mt-6 flex items-center justify-between rounded-[28px] bg-paper px-5 py-4"
      >
        <div>
          <p className="font-serif text-xl">Detailed progress</p>
          <p className="text-sm text-muted">Past days, logs, and graphs</p>
        </div>
        <ArrowUpRight size={20} />
      </Link>

      {sheet ? <LogSheet date={date} onClose={() => setSheet(false)} onSaved={load} /> : null}
    </div>
  );
}
