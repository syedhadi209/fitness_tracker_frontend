"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { DateNav } from "@/components/date-nav";
import { api, errorMessage } from "@/lib/api";
import { grams, kcal, num, todayISO } from "@/lib/format";
import type { Dashboard, MealLog, WorkoutLog } from "@/lib/types";

export function DayDetail() {
  const [date, setDate] = useState("");
  const [data, setData] = useState<Dashboard | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setDate((current) => current || todayISO());
  }, []);

  const load = useCallback(async () => {
    if (!date) return;
    setError("");
    try {
      const [dash, mealPage, workoutPage] = await Promise.all([
        api.dashboard(date),
        api.meals(date),
        api.workouts(date),
      ]);
      setData(dash);
      setMeals(mealPage.results);
      setWorkouts(workoutPage.results);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  if (!date) return null;

  return (
    <section className="mt-6 rounded-[28px] bg-paper p-5">
      <h2 className="mb-4 font-serif text-xl">Day by day</h2>
      <DateNav date={date} onChange={setDate} />
      {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Metric label="Eaten" value={kcal(data?.consumed.calories)} />
        <Metric label="Burned" value={kcal(data?.burned.total)} />
        <Metric label="Steps" value={(data?.burned.step_count ?? 0).toLocaleString()} />
      </div>

      <div className="mt-4 space-y-3">
        {!meals.length && !workouts.length ? (
          <p className="rounded-2xl bg-cream px-4 py-5 text-sm text-muted">Nothing logged this day.</p>
        ) : null}

        {meals.map((meal) => (
          <article key={meal.id} className="rounded-2xl bg-cream p-4">
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
                aria-label={`Delete ${meal.meal_type}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {meal.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.description}</span>
                  <span className="text-muted">{kcal(item.calories)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}

        {workouts.map((workout) => (
          <article key={workout.id} className="rounded-2xl bg-cream p-4">
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
                aria-label={`Delete ${workout.description}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream px-2 py-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
