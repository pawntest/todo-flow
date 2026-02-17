import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

export const formatDueDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isPast(d)) return 'Overdue';
  
  const days = differenceInDays(d, new Date());
  if (days < 7) return format(d, 'EEEE');
  return format(d, 'MMM d');
};

export const getDueDateColor = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isPast(d) && !isToday(d)) return 'text-red-600';
  if (isToday(d)) return 'text-blue-600';
  return 'text-gray-600';
};
