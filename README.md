# Sprint Dashboard

Energy-based sprint batching system for focused, intentional work. Organize tasks into 4 daily sprints, track progress, and stay accountable with daily guardrails.

## Features

- **Brain Dump** — Quick task capture via `bd:` trigger (OpenClaw integration)
- **4 Daily Sprints** — Drag & drop tasks from backlog into sprint buckets
- **Focus Mode** — Work through one sprint at a time with task completion tracking
- **Daily Highlight** — Set your #1 priority task each day
- **4 PM Rule** — Warning if your highlight hasn't been started by 4 PM
- **Daily Reset** — Incomplete sprint tasks auto-return to backlog at end of day
- **Skip Counter** — Tasks skipped 3+ times auto-promote to urgent
- **Energy Logging** — Track your energy level to optimize sprint planning
- **Smart Triage** — Gmail & Calendar integration for auto-categorizing tasks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| AI | OpenClaw (brain dump, triage, LLM analysis) |
| Integrations | Gmail API, Google Calendar API |
| Notifications | Discord (cron check-ins) |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (with schema applied)
- Google OAuth credentials (for Gmail/Calendar sync)
- OpenClaw instance (for brain dump + cron features)

### Setup

```bash
git clone https://github.com/RZ3M/sprint-dashboard.git
cd sprint-dashboard
npm install
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database

Apply the schema to your Supabase instance:

```bash
psql < supabase/schema.sql
```

### Run

```bash
npm run dev     # Development server → http://localhost:3000
npm run build   # Production build
npm run start   # Start production server
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard UI
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Styles + animations
│   └── api/sprint/route.ts   # Sprint API (GET + POST)
├── components/
│   ├── types.ts              # Shared TypeScript interfaces
│   ├── TaskCard.tsx          # Task card rendering
│   ├── Column.tsx            # Sprint/backlog column
│   └── HighlightBanner.tsx   # Daily highlight display
└── lib/
    ├── utils.ts              # Client utilities
    └── server-utils.ts       # Server utilities (timezone)
```

## Roadmap

See [MVP.md](./MVP.md) for the full feature spec and progress tracker.

**Current status:** 18/24 MVP features complete

**Coming next:**
- Sprint timer (2-3 hr countdown with pause/resume)
- Work logging (auto-log time on task completion)
- 9 PM hard stop
- Brain Dump v2 (capture ideas, feelings, notes, goals)
- Weekly LLM insights

## License

MIT
