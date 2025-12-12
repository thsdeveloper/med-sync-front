/**
 * Calendar configuration and localization setup
 *
 * This module configures react-big-calendar with date-fns adapter and Portuguese (pt-BR) locale.
 * The localizer handles all date formatting and manipulation for the calendar component.
 */

import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Portuguese date format strings for calendar display
 */
const dateFormats = {
  dayFormat: 'dd',          // Day number (01-31)
  weekdayFormat: 'EEEE',    // Full weekday name (Segunda-feira, etc.)
  monthHeaderFormat: 'MMMM yyyy', // Month and year (Janeiro 2024)
  dayHeaderFormat: 'EEEE, dd/MM/yyyy', // Full date header
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`,
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`,
  agendaDateFormat: 'EEE dd/MM', // Weekday + date (Seg 15/01)
  agendaTimeFormat: 'HH:mm',     // Time (14:30)
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'HH:mm', { locale: ptBR })} - ${format(end, 'HH:mm', { locale: ptBR })}`,
  selectRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'dd/MM', { locale: ptBR })} - ${format(end, 'dd/MM', { locale: ptBR })}`,
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, 'HH:mm', { locale: ptBR })} - ${format(end, 'HH:mm', { locale: ptBR })}`,
  timeGutterFormat: 'HH:mm',     // Time in sidebar (14:30)
};

/**
 * Portuguese translations for calendar UI
 */
export const calendarMessages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há plantões neste período.',
  showMore: (total: number) => `+ ${total} mais`,
  work_week: 'Semana útil',
};

/**
 * Date-fns localizer configured with Portuguese locale
 *
 * This localizer is used by react-big-calendar to handle all date operations
 * including formatting, parsing, and week calculations.
 */
export const calendarLocalizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string) =>
    format(date, formatStr, { locale: ptBR }),
  parse: (dateStr: string, formatStr: string) =>
    parse(dateStr, formatStr, new Date(), { locale: ptBR }),
  startOfWeek: (date: Date) =>
    startOfWeek(date, { locale: ptBR, weekStartsOn: 0 }), // 0 = Sunday
  getDay: (date: Date) => getDay(date),
  locales: { 'pt-BR': ptBR },
});

/**
 * Custom date formats configuration
 * Can be passed to the Calendar component's formats prop
 */
export { dateFormats };
