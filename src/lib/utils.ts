import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Time utilities for Toronto timezone

export const getTorontoDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
};

export const getTorontoDateString = (): string => {
  const torontoDate = getTorontoDate();
  const year = torontoDate.getFullYear();
  const month = String(torontoDate.getMonth() + 1).padStart(2, '0');
  const day = String(torontoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (minutes: number | null): string => {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}m`;
};

export const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const isPast4PM = (testMode: boolean = false): boolean => {
  const now = getTorontoDate();
  return testMode || now.getHours() >= 16;
};

export const isPast9PM = (): boolean => {
  const now = getTorontoDate();
  return now.getHours() >= 21;
};

export const isSnoozedUntil = (): boolean => {
  if (typeof window === 'undefined') return false;
  const snoozed = localStorage.getItem('hardStopSnoozedUntil');
  if (!snoozed) return false;
  return Date.now() < parseInt(snoozed, 10);
};

export const snoozeHardStop = () => {
  const thirtyMinutesFromNow = Date.now() + 30 * 60 * 1000;
  localStorage.setItem('hardStopSnoozedUntil', thirtyMinutesFromNow.toString());
};

export const clearSnooze = () => {
  localStorage.removeItem('hardStopSnoozedUntil');
};

export const TIMER_STORAGE_KEY = 'sprintTimerState';
export const TIMER_DURATION_MINUTES = 120;

export interface StoredTimerState {
  remainingSeconds: number;
  isRunning: boolean;
  sprintId: string | null;
  startedAt: number | null;
}

export const saveTimerState = (state: StoredTimerState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
};

export const loadTimerState = (): StoredTimerState | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(TIMER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const clearTimerState = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TIMER_STORAGE_KEY);
};

export const formatTimerTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Category colors for task badges
export const categoryColors = {
  urgent: "bg-red-500/20 text-red-400",
  admin: "bg-yellow-500/20 text-yellow-400",
  creative: "bg-blue-500/20 text-blue-400",
  deadline: "bg-purple-500/20 text-purple-400"
};
