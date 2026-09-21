"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/field";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoalDurationField } from "@/components/goal-duration-field";
import { HeightField } from "@/components/height-field";
import { WeightField } from "@/components/weight-field";
import { useAuth } from "@/context/auth-context";
import { errorMessage } from "@/lib/api";
import { todayISO } from "@/lib/format";
import { paceLabel, weeklyChangeKg } from "@/lib/pace";

export default function OnboardingPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    date_of_birth: "1995-01-01",
    sex: "male" as "male" | "female",
    height_cm: "175",
    activity_level: "moderate",
    goal: "maintain",
    current_weight_kg: "",
    target_weight_kg: "",
    goal_duration_weeks: "12",
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!user) return;
    setForm((current) => ({
      ...current,
      first_name: user.first_name || current.first_name,
      date_of_birth: user.profile.date_of_birth || current.date_of_birth,
      sex: (user.profile.sex || current.sex) as "male" | "female",
      height_cm: String(user.profile.height_cm || current.height_cm),
      activity_level: user.profile.activity_level || current.activity_level,
      goal: user.profile.goal || current.goal,
        target_weight_kg: user.profile.target_weight_kg
          ? String(user.profile.target_weight_kg)
          : current.target_weight_kg,
        goal_duration_weeks: user.profile.goal_duration_weeks
          ? String(user.profile.goal_duration_weeks)
          : current.goal_duration_weeks,
    }));
    import("@/lib/api").then(({ api }) =>
      api.weights().then((page) => {
        const latest = page.results[0];
        if (latest) {
          setForm((current) => ({ ...current, current_weight_kg: String(latest.weight_kg) }));
        }
      }),
    );
  }, [user, loading, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { api } = await import("@/lib/api");
      const weight = Number(form.current_weight_kg);
      if (!weight) {
        setError("Current weight is required to calculate maintenance calories.");
        setBusy(false);
        return;
      }
      const changing = form.goal !== "maintain";
      const target = form.target_weight_kg ? Number(form.target_weight_kg) : null;
      const weeks = form.goal_duration_weeks ? Number(form.goal_duration_weeks) : null;
      if (changing) {
        if (!target) {
          setError("Target weight is required so we can plan the calorie target.");
          setBusy(false);
          return;
        }
        if (!weeks || weeks < 1) {
          setError("Say how long you want to take to reach that weight.");
          setBusy(false);
          return;
        }
        if (form.goal === "lose" && target >= weight) {
          setError("Target weight should be below your current weight.");
          setBusy(false);
          return;
        }
        if (form.goal === "gain" && target <= weight) {
          setError("Target weight should be above your current weight.");
          setBusy(false);
          return;
        }
      }
      await api.updateMe({
        first_name: form.first_name,
        profile: {
          date_of_birth: form.date_of_birth,
          sex: form.sex,
          height_cm: Number(form.height_cm),
          activity_level: form.activity_level as never,
          goal: form.goal as never,
          target_weight_kg: target,
          goal_duration_weeks: changing ? weeks : null,
        },
      });
      await api.upsertWeight({ date: todayISO(), weight_kg: weight });
      await refreshUser();
      router.replace("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  const pace = paceLabel(
    weeklyChangeKg(
      Number(form.current_weight_kg),
      Number(form.target_weight_kg),
      Number(form.goal_duration_weeks),
    ),
  );

  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="absolute right-6 top-6">
        <ThemeToggle compact />
      </div>
      <p className="text-sm font-medium text-moss">Almost there</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">A few details so calories make sense.</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <Field label="First name">
          <input
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            className="field"
            placeholder="Alex"
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })}
            className="field"
          />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Sex</p>
          <div className="grid grid-cols-2 gap-2">
            {(["male", "female"] as const).map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => setForm({ ...form, sex })}
                className={`rounded-2xl py-3 capitalize ${form.sex === sex ? "bg-night text-lime" : "bg-paper"}`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>
        <HeightField
          required
          cm={form.height_cm}
          onChange={(height_cm) => setForm({ ...form, height_cm })}
        />
        <WeightField
          required
          kg={form.current_weight_kg}
          onChange={(current_weight_kg) => setForm({ ...form, current_weight_kg })}
          hint="needed for maintenance calories"
        />
        <Field label="Activity level">
          <select
            value={form.activity_level}
            onChange={(event) => setForm({ ...form, activity_level: event.target.value })}
            className="field"
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Lightly active</option>
            <option value="moderate">Moderately active</option>
            <option value="active">Very active</option>
            <option value="athlete">Athlete</option>
          </select>
        </Field>
        <Field label="Goal">
          <select
            value={form.goal}
            onChange={(event) => setForm({ ...form, goal: event.target.value })}
            className="field"
          >
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain weight</option>
          </select>
        </Field>
        <WeightField
          kg={form.target_weight_kg}
          onChange={(target_weight_kg) => setForm({ ...form, target_weight_kg })}
          label="Target weight"
          hint={form.goal === "maintain" ? "optional" : "required for this goal"}
          required={form.goal !== "maintain"}
        />
        {form.goal !== "maintain" ? (
          <>
            <GoalDurationField
              required
              weeks={form.goal_duration_weeks}
              onChange={(goal_duration_weeks) => setForm({ ...form, goal_duration_weeks })}
            />
            {pace ? <p className="text-sm text-muted">{pace}</p> : null}
          </>
        ) : null}
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-2xl bg-night py-3 font-semibold text-lime disabled:opacity-50"
        >
          {busy ? "Saving..." : "Enter Relish"}
        </button>
      </form>
    </main>
  );
}
