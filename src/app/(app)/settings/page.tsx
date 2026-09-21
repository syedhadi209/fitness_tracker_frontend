"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/field";
import { RelishMark } from "@/components/relish-mark";
import { GoalDurationField } from "@/components/goal-duration-field";
import { HeightField } from "@/components/height-field";
import { WeightField } from "@/components/weight-field";
import { useAuth } from "@/context/auth-context";
import { useTheme, type Theme } from "@/context/theme-context";
import { api, errorMessage } from "@/lib/api";
import { todayISO } from "@/lib/format";
import { paceLabel, weeklyChangeKg } from "@/lib/pace";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    date_of_birth: "",
    sex: "male",
    height_cm: "",
    activity_level: "moderate",
    goal: "maintain",
    current_weight_kg: "",
    target_weight_kg: "",
    goal_duration_weeks: "",
    daily_calorie_target: "",
    daily_protein_target_g: "",
    daily_carbs_target_g: "",
    daily_fat_target_g: "",
    timezone: "UTC",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name || "",
      date_of_birth: user.profile.date_of_birth || "",
      sex: user.profile.sex || "male",
      height_cm: user.profile.height_cm ? String(user.profile.height_cm) : "",
      activity_level: user.profile.activity_level,
      goal: user.profile.goal,
      current_weight_kg: "",
      target_weight_kg: user.profile.target_weight_kg ? String(user.profile.target_weight_kg) : "",
      goal_duration_weeks: user.profile.goal_duration_weeks
        ? String(user.profile.goal_duration_weeks)
        : "",
      daily_calorie_target: user.profile.daily_calorie_target
        ? String(user.profile.daily_calorie_target)
        : "",
      daily_protein_target_g: user.profile.daily_protein_target_g
        ? String(user.profile.daily_protein_target_g)
        : "",
      daily_carbs_target_g: user.profile.daily_carbs_target_g
        ? String(user.profile.daily_carbs_target_g)
        : "",
      daily_fat_target_g: user.profile.daily_fat_target_g
        ? String(user.profile.daily_fat_target_g)
        : "",
      timezone: user.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    api.weights().then((page) => {
      const latest = page.results[0];
      if (latest) {
        setForm((current) => ({ ...current, current_weight_kg: String(latest.weight_kg) }));
      }
    }).catch(() => {});
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const changing = form.goal !== "maintain";
      const weight = form.current_weight_kg ? Number(form.current_weight_kg) : 0;
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
        if (weight && form.goal === "lose" && target >= weight) {
          setError("Target weight should be below your current weight.");
          setBusy(false);
          return;
        }
        if (weight && form.goal === "gain" && target <= weight) {
          setError("Target weight should be above your current weight.");
          setBusy(false);
          return;
        }
      }
      await api.updateMe({
        first_name: form.first_name,
        profile: {
          date_of_birth: form.date_of_birth || null,
          sex: form.sex as "male" | "female",
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          activity_level: form.activity_level as never,
          goal: form.goal as never,
          target_weight_kg: target,
          goal_duration_weeks: changing ? weeks : null,
          daily_calorie_target: form.daily_calorie_target ? Number(form.daily_calorie_target) : null,
          daily_protein_target_g: form.daily_protein_target_g
            ? Number(form.daily_protein_target_g)
            : null,
          daily_carbs_target_g: form.daily_carbs_target_g ? Number(form.daily_carbs_target_g) : null,
          daily_fat_target_g: form.daily_fat_target_g ? Number(form.daily_fat_target_g) : null,
          timezone: form.timezone,
        },
      });
      if (form.current_weight_kg) {
        await api.upsertWeight({
          date: todayISO(),
          weight_kg: Number(form.current_weight_kg),
        });
      }
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const pace = paceLabel(
    weeklyChangeKg(
      Number(form.current_weight_kg),
      Number(form.target_weight_kg),
      Number(form.goal_duration_weeks),
    ),
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-8">
      <h1 className="font-serif text-4xl">You</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>
      <section className="mt-6 rounded-[28px] bg-paper p-5">
        <div className="mb-3 flex items-center gap-3">
          <RelishMark size={40} />
          <div>
            <p className="font-serif text-xl">Appearance</p>
            <p className="text-sm text-muted">Light, dark, or match the system</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as Theme[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`rounded-2xl py-3 capitalize ${
                theme === option ? "bg-night text-lime" : "bg-cream"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="First name">
          <input
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            className="field"
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
                className={`rounded-2xl py-3 capitalize ${form.sex === sex ? "bg-night text-lime" : "bg-cream"}`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>
        <HeightField cm={form.height_cm} onChange={(height_cm) => setForm({ ...form, height_cm })} />
        <WeightField
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
            <option value="gain">Gain</option>
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
        <Field label="Daily calorie target" hint="(leave blank to use TDEE adjusted for your goal)">
          <input
            type="number"
            value={form.daily_calorie_target}
            onChange={(event) => setForm({ ...form, daily_calorie_target: event.target.value })}
            className="field"
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Protein" hint="(g)">
            <input
              type="number"
              value={form.daily_protein_target_g}
              onChange={(event) => setForm({ ...form, daily_protein_target_g: event.target.value })}
              className="field"
            />
          </Field>
          <Field label="Carbs" hint="(g)">
            <input
              type="number"
              value={form.daily_carbs_target_g}
              onChange={(event) => setForm({ ...form, daily_carbs_target_g: event.target.value })}
              className="field"
            />
          </Field>
          <Field label="Fat" hint="(g)">
            <input
              type="number"
              value={form.daily_fat_target_g}
              onChange={(event) => setForm({ ...form, daily_fat_target_g: event.target.value })}
              className="field"
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-ember">{error}</p> : null}
        {saved ? <p className="text-sm text-moss">Saved.</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-night py-3 font-semibold text-lime disabled:opacity-50"
        >
          Save profile
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="mt-6 w-full rounded-2xl border border-ink/15 py-3 text-sm font-medium"
      >
        Sign out
      </button>
    </div>
  );
}
