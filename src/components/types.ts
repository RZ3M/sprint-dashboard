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
