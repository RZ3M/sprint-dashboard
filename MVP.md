# Sprint Batching System — MVP Specification

## 🎯 MVP Definition

**Minimum Viable Product:** A functioning system that enables energy-based sprint batching with daily guardrails, work logging, and basic insights — no manual task management required after initial setup.

---

## 📋 MVP Features

### Phase 1: Core Infrastructure (Already Built)
- [x] Gmail API integration (read emails)
- [x] Google Calendar API integration (read events)
- [x] Smart triage (filter noise, categorize actionable items)
- [x] Dashboard UI (sprint buckets, focus mode)
- [x] Discord check-in cron jobs

### Phase 2: Task Management
- [x] **Brain Dump** — Input via "bd:" trigger to add tasks to buckets
- [x] **Time Estimation** — LLM estimates time for each task
- [x] **4 Sprints** — Configure view with 4 sprint columns + backlog
- [x] **Drag & Drop** — Assign tasks to sprints via drag and drop
- [ ] **Brain Dump v2: Full Capture** — Extract ideas, feelings, notes, goals in addition to tasks
- [ ] **Master Document View** — Browse brain dumps organized by type/date
- [ ] **Deadline Detection** — Auto-detect deadlines from emails/calendar → deadline bucket

### Phase 3: Sprint Execution
- [ ] **Daily Highlight** — UI to set 1 priority task per day
- [ ] **Sprint Timer** — 2-3 hr countdown with pause/resume
- [ ] **4 PM Rule** — Notification if highlight not started by 4pm
- [ ] **9 PM Hard Stop** — Block task access after 9pm

### Phase 4: Work Logging
- [ ] **Task Completion** — Mark tasks done → auto-log time spent
- [ ] **Energy Logging** — Log energy level per sprint
- [ ] **Manual Entry** — Add time entries for off-app work

### Phase 5: Insights (Basic)
- [ ] **Weekly Summary** — LLM-generated recap of tasks completed, time spent per category
- [ ] **Trend Detection** — Simple patterns (e.g., "you're most productive Tuesday mornings")

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **AI Brain** | OpenClaw | Triage, cron, brain dump processing, LLM analysis |
| **Frontend** | Next.js 16 + React + Tailwind | Dashboard UI |
| **Data Store** | Supabase (PostgreSQL) | Tasks, logs, user state |
| **Integrations** | Gmail API, Google Calendar API | Email + calendar sync |
| **Notifications** | Discord | Check-ins, reminders |
| **LLM** | MiniMax (via OpenClaw) | Categorization, weekly analysis |

---

## 📊 Data Models

### Sprint
```json
{
 "id": "uuid",
 "sprint_number": 1-4,
 "date": "YYYY-MM-DD",
 "title": "Sprint 1"
}
```

### Task
```json
{
 "id": "uuid",
 "title": "string",
 "description": "string",
 "category": "urgent | admin | creative | deadline",
 "source": "email | calendar | brain_dump",
 "deadline": "ISO date | null",
 "completed": false,
 "time_estimate_minutes": "number | null",
 "sprint_id": "uuid | null",
 "created_at": "ISO date"
}
```

### Brain Dump Entry (NEW - v2)
```json
{
 "id": "uuid",
 "brain_dump_id": "uuid",
 "type": "task | idea | feeling | note | reflection | goal",
 "content": "string",
 "category": "urgent | admin | creative | deadline | null",
 "time_estimate_minutes": "number | null",
 "created_at": "ISO date"
}
```

### Daily Log
```json
{
 "date": "YYYY-MM-DD",
 "energy_level": "low | medium | high",
 "highlight_task_id": "uuid | null",
 "highlight_completed": false,
 "sprints_completed": 0,
 "notes": "string"
}
```

### Work Log
```json
{
 "id": "uuid",
 "date": "YYYY-MM-DD",
 "task_id": "uuid | null",
 "sprint_category": "urgent | admin | creative | deadline",
 "duration_minutes": "number",
 "energy_level": "low | medium | high",
 "notes": "string"
}
```

### Weekly Log
```json
{
 "weekStart": "YYYY-MM-DD",
 "totalTimeByCategory": { "urgent": 120, "admin": 60 },
 "insights": "LLM-generated text",
 "recommendations": ["string"]
}
```

---

## 🔄 User Flows

### Brain Dump Flow (v1 - current)
1. User sends "bd: task1, task2, idea1..."
2. OpenClaw extracts tasks with time estimates
3. Saves to tasks table
4. Confirms to user

### Brain Dump Flow (v2 - proposed)
1. User sends "bd: task1, feeling:..., idea:..., note:..."
2. OpenClaw extracts ALL entry types (tasks, ideas, feelings, notes, goals)
3. Saves to brain_dump_entries table
4. Raw dump saved to brain_dumps table
5. User can browse in Master Document View

### Configure Sprint Flow (current)
1. User sees 5 columns: Backlog + Sprint 1-4
2. Drags tasks from backlog to sprints
3. Tasks auto-save to database

### Focus Sprint Flow (current)
1. User selects sprint (1-4) via buttons
2. Views tasks for that sprint only
3. Marks tasks complete
4. Done toggle shows completed tasks

### Morning Flow
1. Discord check-in @ 10am → user selects energy level
2. Dashboard shows recommended sprint category
3. User sets Daily Highlight
4. User starts Sprint Timer

### Throughout Day
1. User works through sprint tasks
2. User marks tasks complete → logged with duration
3. Energy drops → user starts new sprint
4. 4pm → 4 PM Rule triggers if highlight not started

### Evening Flow
1. Discord check-in @ 5pm → daily recap
2. 9pm → Hard stop enforced

### Weekly Flow
1. Sunday → LLM analyzes week's logs
2. Generates insights + recommendations
3. User reviews → adjusts system

---

## ✅ MVP Checkbox

| # | Feature | Status |
|---|---------|--------|
| 1 | Gmail + Calendar sync | ✅ Done |
| 2 | Smart triage (noise filter) | ✅ Done |
| 3 | Dashboard with buckets | ✅ Done |
| 4 | Focus mode | ✅ Done |
| 5 | Discord cron check-ins | ✅ Done |
| 6 | Brain dump (bd: trigger) | ✅ Done |
| 7 | Time estimation (LLM) | ✅ Done |
| 8 | 4 Sprints (Configure view) | ✅ Done |
| 9 | Backlog column | ✅ Done |
| 10 | Drag & drop task assignment | ✅ Done |
| 11 | Sprint selector in Focus view | ✅ Done |
| 12 | Done task toggle per sprint | ✅ Done |
| 13 | Energy level logging | ✅ Done |
| 14 | **Brain Dump v2: Full Capture** | 🔲 |
| 15 | **Master Document View** | 🔲 |
| 16 | Deadline category detection | 🔲 |
| 17 | Daily highlight UI | ✅ Done |
| 18 | Sprint timer | 🔲 |
| 19 | Work logging (auto) | 🔲 |
| 20 | 4 PM rule notification | ✅ Done |
| 21 | 9 PM hard stop | 🔲 |
| 22 | Weekly LLM insights | 🔲 |

---

## 📝 Feature Specs (In Progress)

### Brain Dump v2: Full Capture

**Entry Types:**
- `task` — Actionable items that go to sprint buckets
- `idea` — Project ideas, features, things to build
- `feeling` — Emotions, mood, reflections
- `note` — Useful information to remember
- `goal` — Things you want to achieve
- `reflection` — Thoughts about the day/week

**Processing:**
- Use LLM to classify each line/segment
- Maintain link to original brain_dump for context
- Allow editing/categorizing after the fact

**Master Document View:**
- Timeline view of all entries
- Filter by type (ideas, feelings, notes, etc.)
- Search functionality
- Link back to original raw dump

---

*Last updated: 2026-03-03*
