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
