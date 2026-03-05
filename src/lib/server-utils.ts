// Server-side time utilities (can be used in API routes)

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

export const isPast4PM = (): boolean => {
  return getTorontoDate().getHours() >= 16;
};
