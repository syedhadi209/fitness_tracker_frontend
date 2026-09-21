"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { api, errorMessage } from "@/lib/api";
import { kcal, num } from "@/lib/format";
import type { ChatEntry, ChatMessage, ChatSession, MealLog, WorkoutLog } from "@/lib/types";

const STARTERS = [
  "Had 2 eggs and toast for breakfast",
  "Ran for 30 minutes this morning",
  "I hit 8,000 steps today",
  "Weighed in at 82 kg",
];

type Bubble = ChatMessage & { entries?: ChatEntry[] };

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    const page = await api.sessions();
    setSessions(page.results);
    return page.results;
  }, []);

  useEffect(() => {
    loadSessions()
      .then(async (list) => {
        const stored = Number(localStorage.getItem("pulse.session") || 0);
        const active = list.find((item) => item.id === stored) ?? list[0];
        if (active) {
          setSessionId(active.id);
          const history = await api.sessionMessages(active.id);
          setMessages(visibleMessages(history));
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [loadSessions]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    setText("");
    const optimistic: Bubble = {
      id: -Date.now(),
      role: "user",
      content: trimmed,
      tool_calls: null,
      tool_call_id: "",
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    try {
      const result = await api.chat(trimmed, sessionId ?? undefined);
      setSessionId(result.session_id);
      localStorage.setItem("pulse.session", String(result.session_id));
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimistic.id),
        optimistic,
        {
          id: result.message_id ?? Date.now() + 1,
          role: "assistant",
          content: result.reply,
          tool_calls: null,
          tool_call_id: "",
          created_at: new Date().toISOString(),
          entries: result.entries,
        },
      ]);
      loadSessions();
    } catch (err) {
      setError(errorMessage(err));
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setText(trimmed);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await send(text);
  }

  async function startNew() {
    localStorage.removeItem("pulse.session");
    setSessionId(null);
    setMessages([]);
  }

  async function openSession(id: number) {
    setSessionId(id);
    localStorage.setItem("pulse.session", String(id));
    const history = await api.sessionMessages(id);
    setMessages(visibleMessages(history));
  }

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col lg:h-screen">
      <header className="flex items-center justify-between border-b border-ink/8 bg-paper px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-moss">Trainer</p>
          <h1 className="font-serif text-xl">Chat like WhatsApp</h1>
        </div>
        <button type="button" onClick={startNew} className="text-sm font-medium text-moss">
          New chat
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 overflow-y-auto border-r border-ink/8 bg-paper p-3 lg:block">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => openSession(session.id)}
              className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm ${
                session.id === sessionId ? "bg-sand" : "hover:bg-cream"
              }`}
            >
              <p className="truncate font-medium">{session.title || "Conversation"}</p>
            </button>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col chat-wallpaper">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {!messages.length ? (
              <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-paper/90 p-5 text-center shadow-sm">
                <p className="font-serif text-2xl">Tell me about your day.</p>
                <p className="mt-2 text-sm text-muted">
                  Food, workouts, steps, weight — just send it the way you would to a trainer.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => send(starter)}
                      className="rounded-2xl bg-cream px-3 py-2 text-left text-sm hover:bg-sand"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === "user"
                      ? "rounded-br-sm bg-lime text-ink"
                      : "rounded-bl-sm bg-paper text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.entries?.length ? (
                    <div className="mt-2 space-y-2">
                      {message.entries.map((entry) => (
                        <EntryCard key={`${entry.entry_type}-${entry.id}`} entry={entry} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-paper px-3 py-2 text-sm text-muted">Typing...</div>
              </div>
            ) : null}
            {error ? <p className="text-center text-sm text-ember">{error}</p> : null}
            <div ref={bottom} />
          </div>

          <form onSubmit={onSubmit} className="border-t border-ink/8 bg-paper px-3 py-3">
            <div className="mx-auto flex max-w-2xl items-end gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(text);
                  }
                }}
                rows={1}
                placeholder="Message your trainer..."
                className="max-h-32 flex-1 resize-none rounded-3xl bg-cream px-4 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-forest text-lime disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function visibleMessages(history: ChatMessage[]): Bubble[] {
  return history.filter(
    (message) =>
      message.role === "user" ||
      (message.role === "assistant" && message.content.trim()),
  );
}

function EntryCard({ entry }: { entry: ChatEntry }) {
  if (entry.entry_type === "meal") {
    const meal = entry as ChatEntry & Partial<MealLog> & { total_calories?: number };
    return (
      <div className="rounded-xl bg-cream px-3 py-2 text-xs">
        <p className="font-semibold capitalize">{String(meal.meal_type ?? "meal")} logged</p>
        <p>{kcal(meal.total_calories)}</p>
      </div>
    );
  }
  if (entry.entry_type === "workout") {
    const workout = entry as ChatEntry & Partial<WorkoutLog>;
    return (
      <div className="rounded-xl bg-cream px-3 py-2 text-xs">
        <p className="font-semibold">{workout.description ?? "Workout"}</p>
        <p>{kcal(workout.calories_burned)}</p>
      </div>
    );
  }
  if (entry.entry_type === "steps") {
    return (
      <div className="rounded-xl bg-cream px-3 py-2 text-xs">
        <p className="font-semibold">{num(entry.steps).toLocaleString()} steps</p>
        <p>{kcal(entry.calories_burned)}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-cream px-3 py-2 text-xs">
      <p className="font-semibold">Weight {num(entry.weight_kg)} kg</p>
    </div>
  );
}
