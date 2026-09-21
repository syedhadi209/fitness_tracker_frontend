"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Footprints, MessageCircle, Plus, Scale, Trash2 } from "lucide-react";

import { DateNav } from "@/components/date-nav";
import { LogSheet } from "@/components/log-sheet";
import { MacroBar, Ring } from "@/components/rings";
import { api, errorMessage } from "@/lib/api";
import { grams, kcal, num, todayISO } from "@/lib/format";
import type { Dashboard, MealLog, StepLog, WeightLog, WorkoutLog } from "@/lib/types";

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<Dashboard | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [stepLog, setStepLog] = useState<StepLog | null>(null);
  const [weightLog, setWeightLog] = useState<WeightLog | null>(null);
  const [stepsInput, setStepsInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [dash, mealPage, workoutPage, stepPage, weightPage] = await Promise.all([
        api.dashboard(date),
        api.meals(date),
        api.workouts(date),
        api.steps(date),
        api.weights(),
      ]);
      setData(dash);
      setMeals(mealPage.results);
      setWorkouts(workoutPage.results);
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
      <DateNav date={date} onChange={setDate} />

      {error ? <p className="mt-4 text-sm text-ember">{error}</p> : null}
      {missingWeight ? (
        <p className="mt-4 rounded-[24px] bg-paper p-4 text-sm">
          Log your current weight so we can calculate maintenance calories and exercise burn.
        </p>
      ) : null}

      <section className="mt-6 rounded-[32px] bg-forest p-6 text-cream shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Ring value={consumed} max={calorieTarget ?? 0}>
            <p className="font-serif text-4xl text-lime">{Math.round(consumed)}</p>
            <p className="text-xs text-cream/70">
              {calorieTarget != null ? `of ${calorieTarget} kcal` : "no target yet"}
            </p>
          </Ring>
          <div className="w-full flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-lime/80">Remaining</p>
              <p className="font-serif text-4xl text-lime">
                {remaining == null ? "—" : Math.round(num(remaining))}
              </p>
              <p className="text-sm text-cream/70">
                Burned {kcal(data?.burned.total)} · net {kcal(data?.net_calories)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-cream/60">Exercise</p>
                <p className="font-medium">{kcal(data?.burned.exercise)}</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-3">
                <p className="text-cream/60">Steps</p>
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
            <button type="submit" className="rounded-2xl bg-ink px-4 font-semibold text-lime">
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
            <button type="submit" className="rounded-2xl bg-ink px-4 font-semibold text-lime">
              Save
            </button>
          </div>
        </form>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl">Today&apos;s log</h2>
          <div className="flex gap-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1.5 text-sm font-semibold text-ink"
            >
              <MessageCircle size={14} /> Text trainer
            </Link>
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-lime"
            >
              <Plus size={14} /> Log
            </button>
          </div>
        </div>

        {!meals.length && !workouts.length ? (
          <p className="rounded-[28px] bg-paper p-6 text-sm text-muted">
            Nothing logged yet. Text your trainer, or tap Log.
          </p>
        ) : null}

        <div className="space-y-3">
          {meals.map((meal) => (
            <article key={meal.id} className="rounded-[24px] bg-paper p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-moss">{meal.meal_type}</p>
                  <p className="font-medium">
                    {kcal(meal.items.reduce((sum, item) => sum + num(item.calories), 0))}
                    <span className="ml-2 text-sm font-normal text-muted">
                      {grams(meal.items.reduce((sum, item) => sum + num(item.protein_g), 0))} protein
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.deleteMeal(meal.id);
                    load();
                  }}
                  className="text-muted hover:text-ember"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                {meal.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.description}</span>
                    <span className="text-muted">{kcal(item.calories)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {workouts.map((workout) => (
            <article key={workout.id} className="rounded-[24px] bg-paper p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ember">Workout</p>
                  <p className="font-medium">{workout.description}</p>
                  <p className="text-sm text-muted">
                    {num(workout.duration_minutes)} min · {kcal(workout.calories_burned)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.deleteWorkout(workout.id);
                    load();
                  }}
                  className="text-muted hover:text-ember"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {sheet ? <LogSheet date={date} onClose={() => setSheet(false)} onSaved={load} /> : null}
    </div>
  );
}
