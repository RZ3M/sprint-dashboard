import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types
export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'urgent' | 'admin' | 'creative' | 'deadline';
  source: 'email' | 'calendar' | 'brain_dump' | 'manual';
  deadline: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  category: 'urgent' | 'admin' | 'creative' | 'deadline';
  start_time: string;
  duration_minutes: number;
  energy_level: 'low' | 'medium' | 'high';
  task_ids: string[];
  completed: boolean;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  highlight_task_id: string | null;
  highlight_completed: boolean;
  sprints_completed: number;
  notes: string;
}

export interface BrainDump {
  id: string;
  raw_content: string;
  processed_content: string | null;
  tasks_extracted: Task[];
  created_at: string;
}

// Database operations
export async function getTasks(category?: string) {
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabase.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getDailyLog(date: string) {
  const { data, error } = await supabase.from('daily_logs').select('*').eq('date', date).single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

export async function upsertDailyLog(log: Partial<DailyLog>) {
  const { data, error } = await supabase.from('daily_logs').upsert(log).select().single();
  if (error) throw error;
  return data;
}

export async function saveBrainDump(dump: { raw_content: string; processed_content?: string; tasks_extracted?: any[] }) {
  const { data, error } = await supabase.from('brain_dumps').insert({
    raw_content: dump.raw_content,
    processed_content: dump.processed_content || null,
    tasks_extracted: dump.tasks_extracted || []
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getWeeklyLogs(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  if (error) throw error;
  return data;
}
