import type {
  ChatMessage,
  ChatResponse,
  ChatSession,
  Dashboard,
  ExerciseType,
  MealItem,
  MealLog,
  Paginated,
  ParsedExercise,
  ParsedMeal,
  StepLog,
  TokenPair,
  User,
  WeightLog,
  WorkoutLog,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const ACCESS_KEY = "pulse.access";
const REFRESH_KEY = "pulse.refresh";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (typeof error.body === "object" && error.body) {
      const body = error.body as Record<string, unknown>;
      if (typeof body.detail === "string") return body.detail;
      const parts = Object.entries(body).flatMap(([key, value]) => {
        if (Array.isArray(value)) return value.map((item) => `${key}: ${item}`);
        if (typeof value === "string") return [`${key}: ${value}`];
        return [];
      });
      if (parts.length) return parts.join(" ");
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function getAccess() {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
}

function getRefresh() {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasTokens() {
  return Boolean(getAccess());
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = getRefresh();
  if (!refresh) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${API_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) {
        clearTokens();
        return false;
      }
      const data = (await response.json()) as TokenPair;
      setTokens(data);
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  const { auth = true, retry = true, headers, ...rest } = options;
  const token = getAccess();
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && auth && retry) {
    const ok = await refreshTokens();
    if (ok) return request<T>(path, { ...options, retry: false });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body,
      typeof body?.detail === "string" ? body.detail : `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export const api = {
  register(data: { email: string; password: string; first_name?: string; last_name?: string }) {
    return request<Pick<User, "id" | "email" | "first_name" | "last_name">>(
      "/api/auth/register/",
      { method: "POST", body: JSON.stringify(data), auth: false },
    );
  },
  login(email: string, password: string) {
    return request<TokenPair>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    });
  },
  me() {
    return request<User>("/api/auth/me/");
  },
  updateMe(data: Partial<Pick<User, "first_name" | "last_name">> & { profile?: Partial<User["profile"]> }) {
    return request<User>("/api/auth/me/", { method: "PATCH", body: JSON.stringify(data) });
  },
  dashboard(date?: string) {
    const query = date ? `?date=${date}` : "";
    return request<Dashboard>(`/api/progress/dashboard/${query}`);
  },
  history(params: { start?: string; end?: string; metric?: "calories" | "steps" | "weight" }) {
    const search = new URLSearchParams();
    if (params.start) search.set("start", params.start);
    if (params.end) search.set("end", params.end);
    if (params.metric) search.set("metric", params.metric);
    const query = search.toString();
    return request<{
      start: string;
      end: string;
      metric: string;
      results: Array<Record<string, unknown>>;
    }>(`/api/progress/history/${query ? `?${query}` : ""}`);
  },
  meals(date?: string) {
    const query = date ? `?date=${date}` : "";
    return request<Paginated<MealLog>>(`/api/nutrition/meals/${query}`);
  },
  createMeal(data: {
    date: string;
    meal_type: MealLog["meal_type"];
    raw_text?: string;
    items: Array<Omit<MealItem, "id">>;
  }) {
    return request<MealLog>("/api/nutrition/meals/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateMeal(id: number, data: Partial<MealLog> & { items?: Array<Omit<MealItem, "id">> }) {
    return request<MealLog>(`/api/nutrition/meals/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteMeal(id: number) {
    return request<void>(`/api/nutrition/meals/${id}/`, { method: "DELETE" });
  },
  parseFood(text: string) {
    return request<ParsedMeal>("/api/nutrition/parse/", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  workouts(date?: string) {
    const query = date ? `?date=${date}` : "";
    return request<Paginated<WorkoutLog>>(`/api/activity/workouts/${query}`);
  },
  createWorkout(data: {
    date: string;
    description: string;
    duration_minutes?: number;
    met_value?: number;
    raw_text?: string;
    source?: string;
    sets?: number;
    reps?: number;
  }) {
    return request<WorkoutLog>("/api/activity/workouts/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteWorkout(id: number) {
    return request<void>(`/api/activity/workouts/${id}/`, { method: "DELETE" });
  },
  parseExercise(text: string) {
    return request<ParsedExercise>("/api/activity/parse/", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  exerciseTypes() {
    return request<Paginated<ExerciseType>>("/api/activity/exercise-types/");
  },
  steps(date?: string) {
    const query = date ? `?date=${date}` : "";
    return request<Paginated<StepLog>>(`/api/activity/steps/${query}`);
  },
  setSteps(data: { date: string; steps: number }) {
    return request<StepLog>("/api/activity/steps/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  weights() {
    return request<Paginated<WeightLog>>("/api/progress/weights/");
  },
  createWeight(data: { date: string; weight_kg: number; body_fat_pct?: number | null; note?: string }) {
    return request<WeightLog>("/api/progress/weights/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateWeight(id: number, data: Partial<Pick<WeightLog, "weight_kg" | "body_fat_pct" | "note" | "date">>) {
    return request<WeightLog>(`/api/progress/weights/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  async upsertWeight(data: { date: string; weight_kg: number }) {
    try {
      return await request<WeightLog>("/api/progress/weights/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const page = await request<Paginated<WeightLog>>("/api/progress/weights/");
      const existing = page.results.find((item) => item.date === data.date);
      if (existing) {
        return request<WeightLog>(`/api/progress/weights/${existing.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ weight_kg: data.weight_kg }),
        });
      }
      throw new Error("Could not save weight");
    }
  },
  sessions() {
    return request<Paginated<ChatSession>>("/api/assistant/sessions/");
  },
  sessionMessages(sessionId: number) {
    return request<ChatMessage[]>(`/api/assistant/sessions/${sessionId}/messages/`);
  },
  chat(message: string, sessionId?: number) {
    return request<ChatResponse>("/api/assistant/chat/", {
      method: "POST",
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  },
};
