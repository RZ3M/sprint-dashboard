-- Sprint Batching System - Supabase Schema

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('urgent', 'admin', 'creative', 'deadline')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('email', 'calendar', 'brain_dump', 'manual')),
  deadline TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brain dumps table
CREATE TABLE brain_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_content TEXT NOT NULL,
  processed_content TEXT,
  tasks_extracted JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  highlight_task_id UUID REFERENCES tasks(id),
  highlight_completed BOOLEAN DEFAULT FALSE,
  sprints_completed INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work log entries (individual sprint/task logs)
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  task_id UUID REFERENCES tasks(id),
  sprint_category TEXT CHECK (sprint_category IN ('urgent', 'admin', 'creative', 'deadline')),
  duration_minutes INTEGER,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_daily_logs_date ON daily_logs(date);
CREATE INDEX idx_work_logs_date ON work_logs(date);

-- Row Level Security (optional - enable if needed)
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE brain_dumps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
