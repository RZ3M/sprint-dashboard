# Sprint Dashboard — Project Guide

**For:** OpenClaw AI Assistant  
**Project:** Sprint Batching System MVP  
**Tech Stack:** Next.js 16 + React + Tailwind + Supabase + OpenClaw

---

## 📁 Project Structure

```
sprint-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard UI (keep under 700 lines)
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles + animations
│   │   └── api/
│   │       └── sprint/route.ts   # Sprint API (GET + POST actions)
│   ├── components/               # Reusable React components
│   │   ├── types.ts              # Shared TypeScript interfaces
│   │   ├── TaskCard.tsx          # Task rendering (configure view)
│   │   ├── Column.tsx            # Sprint/backlog column
│   │   ├── HighlightBanner.tsx   # Daily highlight display
│   │   └── FocusTaskList.tsx     # Focus view task list
│   └── lib/
│       ├── utils.ts              # Client utilities (formatTime, categoryColors, etc.)
│       └── server-utils.ts       # Server utilities (timezone)
├── supabase/
│   └── schema.sql               # Database schema
├── MVP.md                       # Feature spec & roadmap
└── CLAUDE.md                   # This file
```

---

## 🏗️ Code Standards

### Component Structure
- **Extract reusable components** — If UI appears 2+ times, make it a component
- **One component per file** — Don't bundle multiple components
- **Keep components focused** — Single responsibility

### File Organization
```
components/
├── [ComponentName].tsx    # Main component
├── types.ts               # Shared interfaces (NOT in separate files)
└── index.ts               # Only if exporting multiple things
```

### State & Data
- **Optimistic updates** — Always update UI immediately, sync in background
- **Avoid fetchData() loops** — Don't call fetchData() after every action if possible
- **Centralize utilities** — Time formatting, colors, constants → lib/utils.ts

### Types
- **Define in components/types.ts** — Single source of truth
- **Type API responses** — Use TypeScript for all fetch responses
- **Export interfaces** — Reuse across components

---

## ⚡ Performance Rules

### UI Responsiveness
- ✅ **DO:** Update local state immediately, then sync with server
- ❌ **DON'T:** Wait for server response before updating UI

```typescript
// ✅ Good - instant feedback
const handleToggleHighlight = async (taskId: string) => {
  setHighlightTask(newTask); // Immediate
  await fetch(...); // Background sync
};

// ❌ Bad - feels slow
const handleToggleHighlight = async (taskId: string) => {
  await fetch(...); // User waits
  fetchData(); // Then waits more
};
```

### Drag & Drop
- Use mouse events (not HTML5 drag/drop) for instant response
- Implement optimistic column updates
- Show visual feedback immediately

---

## 🎨 UI Patterns

### Tailwind Classes
- Use `zinc` color scale for dark theme
- Consistent spacing: `p-3`, `p-4`, `mb-4`, `gap-2`
- Card style: `bg-zinc-800/50 rounded-lg border border-zinc-700/50`

### Consistent Heights
- **Never let content change layout** — Use `min-h-[X]` for fixed heights
- Placeholder elements for conditional content

### Interactions
- All buttons/actions should feel instant
- Loading states only for initial load or sync operations

---

## 🔧 Common Tasks

### Adding a New Feature
1. Add API endpoint in `src/app/api/sprint/route.ts`
2. Create component in `src/components/`
3. Add to page.tsx
4. Update types if needed

### Adding New Task Action
1. Add action handler in API POST
2. Add handler function in page.tsx
3. Use optimistic updates

### Modifying Task Card
1. Edit `src/components/TaskCard.tsx`
2. Changes reflect everywhere

---

## 🚀 MVP Priorities

| Phase | Features |
|-------|----------|
| ✅ Done | Brain dump, 4 sprints, Drag & drop, Daily highlight, 4PM rule |
| Next | Sprint timer, Work logging, 9PM hard stop |
| Later | Brain dump v2, Master document view, Weekly insights |

---

## 🐛 Debugging

### Check Console
- Browser DevTools Console for React errors
- Network tab for API failures

### Common Issues
- **Build fails:** Check imports — use `../` for components, `../../lib/` for utils
- **Type errors:** Ensure types imported from `components/types.ts`
- **Stale data:** Call `fetchData()` after mutations

---

## 📋 Commands

```bash
cd ~/sprint-dashboard
npm run dev      # Development server
npm run build   # Production build
npm run start   # Start production server
```

---

*Last updated: 2026-03-04*
