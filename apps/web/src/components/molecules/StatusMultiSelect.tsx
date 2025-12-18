'use client';

import { cn } from '@/lib/utils';
import type { ShiftStatus } from '@/types/calendar';

interface StatusOption {
    value: ShiftStatus;
    label: string;
    color: string;
}

const STATUS_OPTIONS: StatusOption[] = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
    { value: 'accepted', label: 'Aceita', color: 'bg-green-500' },
    { value: 'declined', label: 'Recusada', color: 'bg-red-500' },
    { value: 'swap_requested', label: 'Troca', color: 'bg-blue-500' },
];

interface StatusMultiSelectProps {
    value: ShiftStatus[];
    onChange: (value: ShiftStatus[]) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * StatusMultiSelect - Multi-select component for shift statuses
 *
 * A molecule component that allows selecting multiple shift statuses
 * using toggle buttons similar to WeekdaySelector pattern.
 *
 * Features:
 * - Toggle buttons for each status
 * - Quick select (all/none) shortcuts
 * - Color-coded status indicators
 * - Disabled state support
 */
export function StatusMultiSelect({
    value,
    onChange,
    disabled = false,
    className,
}: StatusMultiSelectProps) {
    const toggleStatus = (status: ShiftStatus) => {
        if (disabled) return;

        if (value.includes(status)) {
            onChange(value.filter((s) => s !== status));
        } else {
            onChange([...value, status]);
        }
    };

    const selectAll = () => {
        if (disabled) return;
        onChange(STATUS_OPTIONS.map((s) => s.value));
    };

    const clearAll = () => {
        if (disabled) return;
        onChange([]);
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Botoes de atalho */}
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

            {/* Grid de status */}
            <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleStatus(option.value)}
                            disabled={disabled}
                            className={cn(
                                'flex items-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all',
                                'border-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1',
                                isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2.5 w-2.5 rounded-full flex-shrink-0',
                                    isSelected ? 'bg-white' : option.color
                                )}
                            />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
