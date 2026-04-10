# Sprint Dashboard

Energy-based sprint batching for focused, intentional work. Organize tasks into 4 daily sprints, track your energy, and stay accountable with daily guardrails.

![Sprint Dashboard](https://raw.githubusercontent.com/RZ3M/sprint-dashboard/main/public/sprint-dash.png)

## Features

### Core Sprint Management
- **4 Daily Sprints** — Configure view with drag-and-drop task assignment across Sprint 1–4 + Backlog
- **Focus Mode** — Work through one sprint at a time with a clean, distraction-free view
- **Sprint Timer** — 2-hour countdown with pause/resume and a 5-minute warning
- **Drag & Drop** — Assign tasks to sprints by dragging from backlog

### Daily Guardrails
- **Today's Highlight** — Star any task as your #1 priority for the day
- **4 PM Rule** — Warning indicator if your highlight hasn't been started by 4 PM
- **9 PM Hard Stop** — Full-screen lockout with daily summary and 30-minute snooze
- **Daily Reset** — Incomplete sprint tasks auto-return to backlog at end of day
- **Skip Counter** — Tasks skipped 3+ times auto-escalate to urgent

### Tracking & Insights
- **Work Logging** — Auto-logs time and energy on task completion
- **Energy Level** — Track low/medium/high energy per sprint session
- **Overview Stats** — See task counts by category at a glance

### Quick Capture
- **Brain Dump** — Send `bd: task1, task2, idea` to your AI assistant — tasks get extracted, categorized, time-estimated, and saved to your backlog automatically
- **Smart Triage** — Gmail and Google Calendar integration auto-categorizes emails and events into sprintable tasks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix-based) |
| Database | Supabase (PostgreSQL) |
| AI | OpenClaw (brain dump, triage, cron check-ins) |
| Integrations | Gmail API, Google Calendar API |
| Notifications | Discord (daily check-ins) |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Optional: Google OAuth credentials (for Gmail/Calendar sync)
- Optional: OpenClaw instance (for brain dump + Discord cron)

### 1. Clone & Install

```bash
git clone https://github.com/RZ3M/sprint-dashboard.git
cd sprint-dashboard
npm install
```

### 2. Supabase Setup

Create a new Supabase project at [supabase.com](https://supabase.com), then apply the schema:

```bash
psql -h <your-host> -U postgres -d postgres -f supabase/schema.sql
```

Or paste the contents of `supabase/schema.sql` into the Supabase SQL Editor.

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
sprint-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard (Sprint + Focus + Configure views)
│   │   ├── layout.tsx         # Root layout with fonts
│   │   ├── globals.css         # Tailwind + custom animations
│   │   └── api/
│   │       ├── sprint/route.ts    # Sprint/task CRUD (GET + POST)
│   │       ├── brain-dump/route.ts # Brain dump ingestion
│   │       └── sync/route.ts       # Gmail/Calendar sync
│   ├── components/
│   │   ├── TaskCard.tsx       # Task card with category, timer, highlight
│   │   ├── Column.tsx         # Sprint/backlog column (Configure view)
│   │   ├── FocusTaskList.tsx  # Sprint task list (Focus view)
│   │   ├── SprintTimer.tsx    # 2hr countdown with pause/resume
│   │   ├── WorkLogList.tsx    # Time/energy log entries
│   │   ├── HighlightBanner.tsx # Today's priority highlight
│   │   └── HardStop.tsx       # 9 PM lockout screen
│   └── lib/
│       └── utils.ts           # cn() helper, formatters
├── supabase/
│   └── schema.sql             # Full DB schema (sprints, tasks, logs)
├── skills/
│   ├── brain-dump/            # OpenClaw skill: bd: trigger → task extraction
│   └── google-integrations/   # OpenClaw skill: Gmail/Calendar triage
└── public/
    └── sprint-dash.png        # Dashboard screenshot for README
```

## Data Model

### Tasks
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "category": "urgent | admin | creative | deadline",
  "source": "manual | email | calendar | brain_dump",
  "completed": false,
  "time_estimate_minutes": 60,
  "sprint_id": "uuid | null",
  "skip_count": 0,
  "created_at": "timestamp"
}
```

### Sprints
```json
{
  "id": "uuid",
  "sprint_number": 1-4,
  "date": "YYYY-MM-DD",
  "title": "Sprint 1"
}
```

### Work Logs
```json
{
  "id": "uuid",
  "date": "YYYY-MM-DD",
  "task_id": "uuid | null",
  "sprint_category": "urgent | admin | creative | deadline",
  "duration_minutes": 45,
  "energy_level": "low | medium | high"
}
```

## API Reference

### GET /api/sprint
Returns all tasks and today's sprints.

### POST /api/sprint
Perform a sprint action. Body:
```json
{ "action": "createTask" | "toggleComplete" | "assignTask" | "logWork" | "dailyReset" | ... }
```

Full action reference in `src/app/api/sprint/route.ts`.

## Screenshots

### Configure View — Sprint Assignment
Drag tasks from backlog into Sprint 1–4 buckets. Set category, time estimate, and priority per task.

### Focus Mode — Sprint Execution
Clean, single-sprint view. Start the 2-hour sprint timer, log energy, mark tasks done as you go.

### Sprint Timer
2-hour countdown with visual progress bar. Pause/resume at any time. Warning at 5 minutes remaining. Persists across page refreshes.

### 9 PM Hard Stop
Automatic lockout screen at 9 PM. Shows daily summary (tasks completed, time logged, energy trend). 30-minute snooze option.

## License

MIT
