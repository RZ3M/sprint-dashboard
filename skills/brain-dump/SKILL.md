---
name: brain-dump
description: Use when user sends a brain dump - text containing tasks, ideas, or things to remember. Process and save to Supabase.
---

# Brain Dump Skill

When the user sends a brain dump (any text containing tasks, ideas, reminders, or things to remember):

## Processing Steps

1. **Analyze the content** - Read through the brain dump and identify each distinct task or item

2. **Categorize each item** into:
   - **urgent** - time-sensitive, needs immediate attention
   - **admin** - low-effort, routine tasks (emails, forms, scheduling)
   - **creative** - deep work, projects, building, writing
   - **deadline** - has a specific due date or deadline

3. **Format for saving** - Structure the tasks as JSON:

```json
{
  "summary": "Brief summary of the brain dump",
  "tasks": [
    {
      "title": "Task name",
      "description": "Optional details",
      "category": "urgent|admin|creative|deadline",
      "deadline": "YYYY-MM-DD or null"
    }
  ]
}
```

4. **Save to Supabase** - Call the Brain Dump API:

```bash
curl -X POST https://your-dashboard-url/api/brain-dump \
  -H "Content-Type: application/json" \
  -d '{"tasks": [...], "summary": "..."}'
```

5. **Confirm** - Tell the user:
   - How many tasks were extracted
   - The categories they were sorted into
   - Ask if they want to adjust anything

## Example

User sends: "Need to finish the project proposal by Friday, also have to reply to that email about the meeting, and I want to start learning Rust this weekend"

Response:
"Got it! I extracted 3 tasks:
- 📋 Finish project proposal → urgent (deadline: Friday)
- 📧 Reply to meeting email → admin
- 🧠 Start learning Rust → creative

Want me to adjust any of these?"
