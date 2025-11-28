'use client';

import { cn } from '@/lib/utils';
import { WEEKDAYS } from '@/schemas/fixed-schedule.schema';

interface WeekdaySelectorProps {
    value: number[];
    onChange: (value: number[]) => void;
    disabled?: boolean;
    className?: string;
}

export function WeekdaySelector({
    value,
    onChange,
    disabled = false,
    className,
}: WeekdaySelectorProps) {
    const toggleDay = (day: number) => {
        if (disabled) return;
        
        if (value.includes(day)) {
            onChange(value.filter((d) => d !== day));
        } else {
            onChange([...value, day].sort((a, b) => a - b));
        }
    };

    const selectAll = () => {
        if (disabled) return;
        onChange([0, 1, 2, 3, 4, 5, 6]);
    };

    const selectWeekdays = () => {
        if (disabled) return;
        onChange([1, 2, 3, 4, 5]);
    };

    const clearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Botões de atalho */}
            <div className="flex gap-2 text-xs">
                <button
                    type="button"
                    onClick={selectAll}
                    disabled={disabled}
                    className={cn(
                        'px-2 py-1 rounded-md transition-colors',
                        'text-slate-600 hover:text-blue-600 hover:bg-blue-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    Todos
                </button>
                <button
                    type="button"
                    onClick={selectWeekdays}
                    disabled={disabled}
                    className={cn(
                        'px-2 py-1 rounded-md transition-colors',
                        'text-slate-600 hover:text-blue-600 hover:bg-blue-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    Seg-Sex
                </button>
                <button
                    type="button"
                    onClick={clearAll}
                    disabled={disabled}
                    className={cn(
                        'px-2 py-1 rounded-md transition-colors',
                        'text-slate-600 hover:text-red-600 hover:bg-red-50',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    Limpar
                </button>
            </div>

            {/* Grid de dias */}
            <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => {
                    const isSelected = value.includes(day.value);
                    return (
                        <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            disabled={disabled}
                            title={day.fullLabel}
                            className={cn(
                                'flex-1 py-2 px-1 text-sm font-medium rounded-lg transition-all',
                                'border-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1',
                                isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

