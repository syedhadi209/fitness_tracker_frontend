"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { num } from "@/lib/format";
import type { ExerciseType, MealItem, MealLog, WorkoutLog } from "@/lib/types";

type Props = {
  date: string;
  onClose: () => void;
  onSaved: () => void;
};

const MEAL_TYPES: MealLog["meal_type"][] = ["breakfast", "lunch", "dinner", "snack"];

const emptyItem = (): Omit<MealItem, "id"> => ({
  description: "",
  quantity: 1,
  unit: "",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
});

export function LogSheet({ date, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"meal" | "workout">("meal");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [mealType, setMealType] = useState<MealLog["meal_type"]>("breakfast");
  const [parseText, setParseText] = useState("");
  const [items, setItems] = useState<Array<Omit<MealItem, "id">>>([emptyItem()]);

  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [types, setTypes] = useState<ExerciseType[]>([]);
  const [exerciseId, setExerciseId] = useState<number | "">("");

  useEffect(() => {
    api.exerciseTypes().then((data) => setTypes(data.results)).catch(() => undefined);
  }, []);

  async function parseMeal() {
    setBusy(true);
    setError("");
    try {
      const draft = await api.parseFood(parseText);
      setMealType(draft.meal_type);
      setItems(
        draft.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        })),
      );
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
      const draft = await api.parseExercise(description);
      setDescription(draft.description);
      setMinutes(draft.duration_minutes);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveMeal() {
    const valid = items.filter((item) => item.description.trim());
    if (!valid.length) {
      setError("Add at least one food.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.createMeal({ date, meal_type: mealType, raw_text: parseText, items: valid });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveWorkout() {
    if (!description.trim()) {
      setError("Describe the workout.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const selected = types.find((item) => item.id === exerciseId);
      await api.createWorkout({
        date,
        description: description.trim(),
        duration_minutes: minutes,
        met_value: selected ? num(selected.met_value) : undefined,
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
            <div className="flex gap-2">
              <input
                value={parseText}
                onChange={(event) => setParseText(event.target.value)}
                placeholder="2 eggs and toast, or just fill it in below"
                className="flex-1 rounded-2xl border border-ink/10 bg-cream px-3 py-2 text-sm outline-none focus:border-moss"
              />
              <button
                type="button"
                onClick={parseMeal}
                disabled={busy || !parseText.trim()}
                className="rounded-2xl bg-lime px-3 text-sm font-semibold text-ink disabled:opacity-40"
              >
                Estimate
              </button>
            </div>
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
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 rounded-2xl bg-cream p-3 sm:grid-cols-6">
                <input
                  value={item.description}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, description: event.target.value };
                    setItems(next);
                  }}
                  placeholder="Food"
                  className="col-span-2 rounded-xl bg-paper px-2 py-1.5 text-sm sm:col-span-2"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, quantity: event.target.value };
                    setItems(next);
                  }}
                  className="rounded-xl bg-paper px-2 py-1.5 text-sm"
                  placeholder="qty"
                />
                <input
                  type="number"
                  value={item.calories}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, calories: event.target.value };
                    setItems(next);
                  }}
                  className="rounded-xl bg-paper px-2 py-1.5 text-sm"
                  placeholder="kcal"
                />
                <input
                  type="number"
                  value={item.protein_g}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, protein_g: event.target.value };
                    setItems(next);
                  }}
                  className="rounded-xl bg-paper px-2 py-1.5 text-sm"
                  placeholder="P"
                />
                <input
                  type="number"
                  value={item.carbs_g}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { ...item, carbs_g: event.target.value };
                    setItems(next);
                  }}
                  className="rounded-xl bg-paper px-2 py-1.5 text-sm"
                  placeholder="C"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems([...items, emptyItem()])}
              className="text-sm font-medium text-moss"
            >
              + Add item
            </button>
            <button
              type="button"
              onClick={saveMeal}
              disabled={busy}
              className="w-full rounded-2xl bg-ink py-3 font-semibold text-lime disabled:opacity-40"
            >
              Save meal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              value={exerciseId}
              onChange={(event) => {
                const id = event.target.value ? Number(event.target.value) : "";
                setExerciseId(id);
                const selected = types.find((item) => item.id === id);
                if (selected) setDescription(selected.name);
              }}
              className="w-full rounded-2xl border border-ink/10 bg-cream px-3 py-2 text-sm"
            >
              <option value="">Choose an exercise, or type your own</option>
              {types.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · MET {item.met_value}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ran 5k, lifted for 40 min..."
                className="flex-1 rounded-2xl border border-ink/10 bg-cream px-3 py-2 text-sm outline-none focus:border-moss"
              />
              <button
                type="button"
                onClick={parseWorkout}
                disabled={busy || !description.trim()}
                className="rounded-2xl bg-lime px-3 text-sm font-semibold disabled:opacity-40"
              >
                Estimate
              </button>
            </div>
            <label className="block text-sm">
              Minutes
              <input
                type="number"
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="mt-1 w-full rounded-2xl border border-ink/10 bg-cream px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={saveWorkout}
              disabled={busy}
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
