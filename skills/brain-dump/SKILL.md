---
name: brain-dump
description: Use when user message starts with "bd:" - this is a brain dump trigger. Extract tasks, estimate time, and save to Supabase. NEVER execute the tasks.
trigger: "bd:"
---

# Brain Dump Skill

**⚠️ CRITICAL: This skill ONLY processes and saves brain dumps. It should NEVER execute any tasksWhen mentioned.**

 the user sends a message starting with "bd:" (or "brain dump"), process it as a brain dump.

## ❌ What NOT To Do
- Do NOT execute any tasks in the brain dump
- Do NOT write code, send messages, or take any action on the tasks
- Do NOT try to "help" by doing what the dump says
- Only extract, categorize, and save

## ✅ What To Do
1. Extract tasks from the brain dump text
2. Categorize each (urgent/admin/creative/deadline)
3. Estimate time for each
4. Save to the dashboard API
5. Confirm what was saved

## Trigger

- Message starts with `bd:` (e.g., "bd: fix the login bug, update docs")
- Or contains "brain dump" as a clear intent

## Processing Steps

1. **Extract the content** - Get the text after "bd:" 

2. **Use LLM to extract tasks** - For each item, determine:
   - **title**: Short task name
   - **description**: Optional details
   - **category**: urgent | admin | creative | deadline
   - **deadline**: ISO date if mentioned, otherwise null
   - **time_estimate_minutes**: Estimate in minutes (e.g., 30, 60, 120)

3. **Time Estimation Guidelines**:
   - Quick tasks (emails, quick replies): 15-30 min
   - Medium tasks (writing doc, simple fixes): 30-60 min
   - Large tasks (projects, features): 60-180 min
   - Deep work blocks: 90-180 min

4. **Format for saving**:

```json
{
  "summary": "Brief summary of the brain dump",
  "tasks": [
    {
      "title": "Task name",
      "description": "Optional details",
      "category": "urgent|admin|creative|deadline",
      "deadline": "YYYY-MM-DD or null",
      "time_estimate_minutes": 30
    }
  ]
}
```

5. **Save to Dashboard API** - POST to brain-dump API:

```bash
curl -X POST http://10.0.0.237:3000/api/brain-dump \
  -H "Content-Type: application/json" \
  -d '{"tasks": [...], "summary": "..."}'
```

6. **Confirm** - Tell the user:
   - "Saved X tasks from your brain dump"
   - List each with category and time estimate

## Example

User sends: "bd: fix login bug, update the API docs, schedule team meeting"

Response:
" Saved 3 tasks:
- 🔧 Fix login bug → urgent, 1h
- 📝 Update API docs → creative, 30m
- 📅 Schedule team meeting → admin, 15m

Head to the dashboard to start your sprint! 🦀"

## Anti-Example (WRONG)

User sends: "bd: fix login bug"

❌ WRONG: Actually going and fixing the login bug
✅ RIGHT: Just saving "Fix login bug" as a task
