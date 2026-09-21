export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Profile = {
  date_of_birth: string | null;
  sex: "" | "male" | "female";
  height_cm: string | number | null;
  activity_level: "sedentary" | "light" | "moderate" | "active" | "athlete";
  goal: "lose" | "maintain" | "gain";
  target_weight_kg: string | number | null;
  goal_duration_weeks: number | null;
  daily_calorie_target: number | null;
  daily_protein_target_g: number | null;
  daily_carbs_target_g: number | null;
  daily_fat_target_g: number | null;
  timezone: string;
  age: number | null;
};

export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile: Profile;
};

export type TokenPair = {
  access: string;
  refresh: string;
};

export type MealItem = {
  id?: number;
  food?: number | null;
  description: string;
  quantity: string | number;
  unit: string;
  calories: string | number;
  protein_g: string | number;
  carbs_g: string | number;
  fat_g: string | number;
};

export type MealLog = {
  id: number;
  date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  raw_text: string;
  source: string;
  source_message: number | null;
  items: MealItem[];
  created_at: string;
};

export type WorkoutLog = {
  id: number;
  date: string;
  exercise_type: number | null;
  description: string;
  duration_minutes: string | number;
  met_value: string | number;
  calories_burned: string | number;
  raw_text: string;
  source: string;
  source_message: number | null;
  created_at: string;
};

export type StepLog = {
  id: number;
  date: string;
  steps: number;
  calories_burned: string | number;
  source: string;
  source_message: number | null;
  updated_at: string;
};

export type WeightLog = {
  id: number;
  date: string;
  weight_kg: string | number;
  body_fat_pct: string | number | null;
  note: string;
  source_message: number | null;
  created_at: string;
};

export type ExerciseType = {
  id: number;
  name: string;
  category: string;
  met_value: string | number;
};

export type Dashboard = {
  date: string;
  consumed: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  burned: {
    exercise: number;
    steps: number;
    step_count: number;
    total: number;
  };
  net_calories: number;
  targets: {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    bmr: number | null;
  };
  calories_remaining: number | null;
  weight_kg: number | null;
};

export type CalorieHistoryPoint = {
  date: string;
  consumed: number;
  burned: number;
  net: number;
  steps: number;
};

export type WeightHistoryPoint = {
  date: string;
  weight_kg: number;
  body_fat_pct: number | null;
};

export type StepHistoryPoint = {
  date: string;
  steps: number;
  calories_burned: number;
};

export type ChatSession = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls: unknown;
  tool_call_id: string;
  created_at: string;
};

export type ChatEntry = {
  entry_type: "meal" | "workout" | "steps" | "weight";
  id: number;
  [key: string]: unknown;
};

export type ChatResponse = {
  session_id: number;
  reply: string;
  message_id: number | null;
  entries: ChatEntry[];
};

export type ParsedMeal = {
  meal_type: MealLog["meal_type"];
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
};

export type ParsedExercise = {
  description: string;
  duration_minutes: number;
  met_value: number;
};
