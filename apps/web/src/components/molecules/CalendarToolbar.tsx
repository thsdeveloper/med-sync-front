/**
 * CalendarToolbar Molecule Component
 *
 * Custom toolbar for react-big-calendar with interactive month/year selectors.
 * Provides navigation controls, view switching, and date selection dropdowns.
 *
 * Features:
 * - Interactive month selector dropdown (Janeiro - Dezembro)
 * - Interactive year selector dropdown (current year ± 5 years range)
 * - Navigation buttons (Hoje, Anterior, Próximo)
 * - View switcher buttons (Mês, Semana, Dia, Agenda)
 * - Date validation to prevent invalid date combinations
 * - Proper state synchronization with calendar display
 *
 * Usage:
 * ```tsx
 * import { CalendarToolbar } from '@/components/molecules/CalendarToolbar';
 *
 * // Pass as components prop to CalendarWrapper
 * <CalendarWrapper
 *   events={events}
 *   components={{
 *     toolbar: CalendarToolbar
 *   }}
 * />
 * ```
 */

'use client';

import React, { useMemo } from 'react';
import { View, ToolbarProps } from 'react-big-calendar';
import { format, setMonth, setYear, isValid, lastDayOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { CalendarWrapperEvent } from '@/components/organisms/CalendarWrapper';

/**
 * Month names in Portuguese for the dropdown
 */
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * View labels in Portuguese
 */
const VIEW_LABELS: Record<View, string> = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  work_week: 'Semana útil',
};

/**
 * Extended toolbar props that include an optional filter slot
 */
export interface ExtendedToolbarProps extends ToolbarProps<CalendarWrapperEvent, object> {
  filterSlot?: React.ReactNode;
}

/**
 * CalendarToolbar - Custom toolbar with interactive month/year selectors
 *
 * This molecule component replaces react-big-calendar's default toolbar with
 * a custom implementation that includes dropdown selectors for month and year.
 * It properly handles date validation and state synchronization.
 *
 * @param props - Toolbar props provided by react-big-calendar
 * @returns Custom toolbar component
 */
export function CalendarToolbar({
  date,
  view,
  views,
  onView,
  onNavigate,
  label,
  filterSlot,
}: ExtendedToolbarProps) {
  /**
   * Generate year options (current year ± 5 years)
   */
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  /**
   * Get current month (0-11)
   */
  const currentMonth = date.getMonth();

  /**
   * Get current year
   */
  const currentYear = date.getFullYear();

  /**
   * Handle month change from dropdown
   * Validates that the selected month/year combination is valid
   */
  const handleMonthChange = (monthStr: string) => {
    const newMonth = parseInt(monthStr, 10);

    // Create new date with selected month
    let newDate = setMonth(date, newMonth);

    // Validate date: if the day doesn't exist in the new month,
    // adjust to the last day of that month
    // Example: Jan 31 → Feb 28/29
    if (!isValid(newDate) || newDate.getMonth() !== newMonth) {
      const lastDay = lastDayOfMonth(setMonth(new Date(date), newMonth));
      newDate = lastDay;
    }

    onNavigate('DATE', newDate);
  };

  /**
   * Handle year change from dropdown
   * Validates that the selected month/year combination is valid
   */
  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr, 10);

    // Create new date with selected year
    let newDate = setYear(date, newYear);

    // Validate date: handle leap year edge cases
    // Example: Feb 29, 2024 → Feb 28, 2025
    if (!isValid(newDate) || newDate.getFullYear() !== newYear) {
      const lastDay = lastDayOfMonth(setMonth(setYear(new Date(date), newYear), currentMonth));
      newDate = lastDay;
    }

    onNavigate('DATE', newDate);
  };

  /**
   * Navigate to today
   */
  const navigateToToday = () => {
    onNavigate('TODAY');
  };

  /**
   * Navigate to previous period (month/week/day based on view)
   */
  const navigateToPrevious = () => {
    onNavigate('PREV');
  };

  /**
   * Navigate to next period (month/week/day based on view)
   */
  const navigateToNext = () => {
    onNavigate('NEXT');
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* Top row: Navigation controls, month/year selectors, and filter slot */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToToday}
              className="h-9"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoje
            </Button>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateToPrevious}
                className="h-9 w-9"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={navigateToNext}
                className="h-9 w-9"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Month selector */}
          <Select
            value={currentMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Selecione o mes" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector */}
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter slot - rendered on the right side */}
        {filterSlot && (
          <div className="flex items-center">
            {filterSlot}
          </div>
        )}
      </div>

      {/* Bottom row: View switcher buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Visualizacao:</span>
        {views &&
          (views as View[]).map((viewName) => (
            <Button
              key={viewName}
              variant={view === viewName ? 'default' : 'outline'}
              size="sm"
              onClick={() => onView(viewName)}
              className="h-9"
            >
              {VIEW_LABELS[viewName]}
            </Button>
          ))}
      </div>
    </div>
  );
}

/**
 * Export component as default
 */
export default CalendarToolbar;
