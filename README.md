# Fitness Tracker Frontend

Next.js app for Pulse — log food, training, steps and weight through a
WhatsApp-style trainer chat, with a dashboard and progress graphs on top of
the Django API.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API must be running on
port 8000.

## Screens

| Route | What it does |
|-------|----------------|
| `/login`, `/register` | Email/password auth |
| `/onboarding` | Height, age, activity, goal (used for TDEE) |
| `/` | Today: calorie ring, macros, steps, weight, meal/workout log |
| `/chat` | Conversational logging with the trainer |
| `/progress` | 30-day calorie, step and weight graphs |
| `/settings` | Profile, custom macro targets, sign out |

Manual logging still works if OpenRouter is not configured. Chat needs
`OPENROUTER_API_KEY` on the backend.
