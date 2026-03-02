---
name: google-integrations
description: Use for Gmail and Google Calendar integration - reading emails, events, and managing OAuth tokens. Also use for sprint batching system that triages emails/calendar into energy-based categories (urgent, admin, creative).
---

# Google Integrations Skill

This skill provides OAuth authentication and API access for Gmail and Google Calendar.

## Setup

1. Credentials file should be at `~/sprint-dashboard/credentials.json`
2. Run OAuth flow: `node ~/sprint-dashboard/skills/google-integrations/scripts/auth.js`
3. Tokens are stored in `~/sprint-dashboard/data/tokens.json`

## Available Actions

### gmail.listEmails

List recent emails from Gmail.

```bash
node ~/sprint-dashboard/skills/google-integrations/scripts/gmail.js list [limit]
```

### calendar.listEvents

List upcoming calendar events.

```bash
node ~/sprint-dashboard/skills/google-integrations/scripts/calendar.js list [daysAhead]
```

### triage

Analyze emails and calendar events, then assign each to a sprint bucket:
- **urgent**: High pressure, time-sensitive items
- **admin**: Low energy, repetitive tasks
- **creative**: Deep work, high focus tasks

Output format:
```json
{
  "urgent": [...],
  "admin": [...],
  "creative": [...]
}
```

## Token Refresh

Tokens auto-refresh when expired. If you get an auth error, run the auth script again.
