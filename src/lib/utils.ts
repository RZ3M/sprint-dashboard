// Time utilities for Toronto timezone

export const getTorontoDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
};

export const getTorontoDateString = (): string => {
  return getTorontoDate().toISOString().split('T')[0];
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

// Category colors for task badges
export const categoryColors = {
  urgent: "bg-red-500/20 text-red-400",
  admin: "bg-yellow-500/20 text-yellow-400",
  creative: "bg-blue-500/20 text-blue-400",
  deadline: "bg-purple-500/20 text-purple-400"
};
