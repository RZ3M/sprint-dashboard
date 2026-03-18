export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'admin' | 'creative' | 'deadline';
  source: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
  time_estimate_minutes: number | null;
  sprint_id: string | null;
  skip_count?: number;
  last_moved_by?: 'user' | 'system';
  last_moved_at?: string;
}

export interface Sprint {
  id: string;
  sprint_number: number;
  date: string;
  title: string;
}

export type ViewMode = 'configure' | 'focus';

export type EnergyLevel = 'low' | 'medium' | 'high';

// API Response types
export interface SprintAPIResponse {
  tasks: Task[];
  completed: Task[];
  sprints: Sprint[];
  energyLevel: EnergyLevel;
  highlightTask: Task | null;
  highlightCompleted: boolean;
  stats: {
    urgent: number;
    admin: number;
    creative: number;
    deadline: number;
  };
}

export interface APIError {
  error: string;
}

export interface APISuccess {
  success: boolean;
}

export interface WorkLog {
  id: string;
  date: string;
  task_id: string | null;
  sprint_category: 'urgent' | 'admin' | 'creative' | 'deadline';
  duration_minutes: number;
  energy_level: 'low' | 'medium' | 'high';
  notes: string;
  created_at: string;
  task_title?: string;
}

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  sprintId: string | null;
  startedAt: number | null;
}
