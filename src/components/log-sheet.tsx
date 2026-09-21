"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { grams, kcal, num } from "@/lib/format";
import type { MealItem, MealLog, ParsedExercise, WorkoutLog } from "@/lib/types";

type Props = {
  date: string;
  onClose: () => void;
  onSaved: () => void;
};

const MEAL_TYPES: MealLog["meal_type"][] = ["breakfast", "lunch", "dinner", "snack"];

type DraftItem = Omit<MealItem, "id">;

function itemTotals(items: DraftItem[]) {
  return items.reduce(
    (sum, item) => ({
      calories: sum.calories + num(item.calories),
      protein_g: sum.protein_g + num(item.protein_g),
      carbs_g: sum.carbs_g + num(item.carbs_g),
      fat_g: sum.fat_g + num(item.fat_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

function portion(item: DraftItem) {
  const qty = num(item.quantity);
  const unit = item.unit?.trim();
  if (!qty) return item.description;
  if (!unit) return `${item.description} × ${qty}`;
  return `${qty} ${unit} ${item.description}`;
}

function workoutSummary(draft: ParsedExercise) {
  const parts: string[] = [];
  if (draft.sets && draft.reps) parts.push(`${draft.sets}×${draft.reps}`);
  if (draft.duration_minutes) {
    const minutes = num(draft.duration_minutes);
    parts.push(`${minutes % 1 ? minutes.toFixed(1) : minutes} min`);
  }
  return parts.join(" · ");
}

export function LogSheet({ date, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"meal" | "workout">("meal");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [mealType, setMealType] = useState<MealLog["meal_type"]>("breakfast");
  const [parseText, setParseText] = useState("");
  const [draft, setDraft] = useState<DraftItem[] | null>(null);
  const [selected, setSelected] = useState(false);

  const [workoutText, setWorkoutText] = useState("");
  const [workoutDraft, setWorkoutDraft] = useState<ParsedExercise | null>(null);
  const [workoutSelected, setWorkoutSelected] = useState(false);

  const totals = useMemo(() => (draft ? itemTotals(draft) : null), [draft]);

  async function parseMeal() {
    setBusy(true);
    setError("");
    try {
      const result = await api.parseFood(parseText);
      setMealType(result.meal_type);
      setDraft(
        result.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        })),
      );
      setSelected(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveMeal() {
    if (!draft?.length || !selected) {
      setError("Estimate the meal, then select it to save.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.createMeal({ date, meal_type: mealType, raw_text: parseText, items: draft });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function parseWorkout() {
    setBusy(true);
    setError("");
    try {
      const result = await api.parseExercise(workoutText);
      setWorkoutDraft(result);
      setWorkoutSelected(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveWorkout() {
    if (!workoutDraft || !workoutSelected) {
      setError("Estimate the exercise, then select it to save.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.createWorkout({
        date,
        description: workoutDraft.description,
        duration_minutes: workoutDraft.duration_minutes,
        met_value: workoutDraft.met_value,
        raw_text: workoutText,
        source: "ai",
        sets: workoutDraft.sets,
        reps: workoutDraft.reps,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-paper p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Log {tab}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-sand">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-sand p-1 text-sm font-medium">
          {(["meal", "workout"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-xl py-2 capitalize ${tab === item ? "bg-ink text-lime" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === "meal" ? (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">
                What did you eat?
                <span className="ml-1 font-normal text-muted">we’ll estimate calories for you</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={parseText}
                  onChange={(event) => {
                    setParseText(event.target.value);
                    setDraft(null);
                    setSelected(false);
                  }}
                  placeholder="2 boiled egg whites, chai with sugar..."
                  className="field min-w-0 flex-1 !w-auto"
                />
                <button
                  type="button"
                  onClick={parseMeal}
                  disabled={busy || !parseText.trim()}
                  className="rounded-2xl bg-lime px-3 text-sm font-semibold text-ink disabled:opacity-40"
                >
                  {busy ? "..." : "Estimate"}
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Meal</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                      mealType === type ? "bg-forest text-lime" : "bg-sand"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {draft?.length ? (
              <button
                type="button"
                onClick={() => setSelected(true)}
                className={`w-full rounded-[24px] p-4 text-left transition ${
                  selected ? "bg-forest text-cream" : "bg-cream"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${selected ? "text-lime/80" : "text-moss"}`}>
                      Estimated meal
                    </p>
                    <p className="font-serif text-xl">{kcal(totals?.calories)}</p>
                  </div>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      selected ? "bg-lime text-ink" : "border border-ink/20"
                    }`}
                  >
                    {selected ? <Check size={14} /> : null}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  {draft.map((item, index) => (
                    <li key={`${item.description}-${index}`} className="flex justify-between gap-3">
                      <span>{portion(item)}</span>
                      <span className={selected ? "text-cream/70" : "text-muted"}>{kcal(item.calories)}</span>
                    </li>
                  ))}
                </ul>
                <p className={`mt-3 text-xs ${selected ? "text-cream/70" : "text-muted"}`}>
                  {grams(totals?.protein_g)} protein · {grams(totals?.carbs_g)} carbs · {grams(totals?.fat_g)} fat
                </p>
              </button>
            ) : (
              <p className="rounded-[24px] bg-cream px-4 py-6 text-sm text-muted">
                Describe the meal and tap Estimate. You’ll get one option to save — no number crunching.
              </p>
            )}

            <button
              type="button"
              onClick={saveMeal}
              disabled={busy || !selected}
              className="w-full rounded-2xl bg-ink py-3 font-semibold text-lime disabled:opacity-40"
            >
              Save meal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">
                What did you do?
                <span className="ml-1 font-normal text-muted">we’ll estimate time and burn for you</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={workoutText}
                  onChange={(event) => {
                    setWorkoutText(event.target.value);
                    setWorkoutDraft(null);
                    setWorkoutSelected(false);
                  }}
                  placeholder="dumbbell bench press 3x12, 10kg..."
                  className="field min-w-0 flex-1 !w-auto"
                />
                <button
                  type="button"
                  onClick={parseWorkout}
                  disabled={busy || !workoutText.trim()}
                  className="rounded-2xl bg-lime px-3 text-sm font-semibold text-ink disabled:opacity-40"
                >
                  {busy ? "..." : "Estimate"}
                </button>
              </div>
            </div>

            {workoutDraft ? (
              <button
                type="button"
                onClick={() => setWorkoutSelected(true)}
                className={`w-full rounded-[24px] p-4 text-left transition ${
                  workoutSelected ? "bg-forest text-cream" : "bg-cream"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        workoutSelected ? "text-lime/80" : "text-moss"
                      }`}
                    >
                      Estimated workout
                    </p>
                    <p className="font-serif text-xl">{workoutDraft.description}</p>
                  </div>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      workoutSelected ? "bg-lime text-ink" : "border border-ink/20"
                    }`}
                  >
                    {workoutSelected ? <Check size={14} /> : null}
                  </span>
                </div>
                <p className="text-sm">{workoutSummary(workoutDraft)}</p>
                <p className={`mt-3 text-xs ${workoutSelected ? "text-cream/70" : "text-muted"}`}>
                  Burn is calculated from your current weight when you save.
                </p>
              </button>
            ) : (
              <p className="rounded-[24px] bg-cream px-4 py-6 text-sm text-muted">
                Describe the exercise and tap Estimate. You’ll get one option to save — no picking from a list.
              </p>
            )}

            <button
              type="button"
              onClick={saveWorkout}
              disabled={busy || !workoutSelected}
              className="w-full rounded-2xl bg-ink py-3 font-semibold text-lime disabled:opacity-40"
            >
              Save workout
            </button>
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-ember">{error}</p> : null}
      </div>
    </div>
  );
}

export type SavedWorkout = WorkoutLog;
