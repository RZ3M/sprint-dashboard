// Server-side time utilities (can be used in API routes)

export const getTorontoDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
};

export const getTorontoDateString = (): string => {
  return getTorontoDate().toISOString().split('T')[0];
};

export const isPast4PM = (): boolean => {
  return getTorontoDate().getHours() >= 16;
};
