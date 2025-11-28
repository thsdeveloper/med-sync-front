'use client';

import { useState } from 'react';
import { 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    startOfDay,
    endOfDay,
    startOfYear,
    endOfYear,
    eachDayOfInterval, 
    eachMonthOfInterval,
    eachHourOfInterval,
    format, 
    isSameMonth, 
    isSameDay, 
    isSameYear,
    addMonths, 
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    addYears,
    subYears,
    isToday,
    getDay,
    setHours,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User, Calendar, CalendarDays, CalendarRange, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Shift, Sector } from '@/schemas/shifts.schema';
import { cn } from '@/lib/utils';

type ViewType = 'day' | 'week' | 'month' | 'year';

interface ShiftCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    shifts: Shift[];
    sectors: Sector[];
    isLoading?: boolean;
}

const VIEW_LABELS: Record<ViewType, string> = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano',
};

const VIEW_ICONS: Record<ViewType, typeof Calendar> = {
    day: Calendar,
    week: CalendarRange,
    month: CalendarDays,
    year: LayoutGrid,
};

export function ShiftCalendar({
    currentDate,
    onDateChange,
    shifts,
    sectors,
    isLoading,
}: ShiftCalendarProps) {
    const [viewType, setViewType] = useState<ViewType>('month');

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekDaysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Navigation functions
    const navigate = (direction: 'prev' | 'next') => {
        const modifier = direction === 'next' ? 1 : -1;
        switch (viewType) {
            case 'day':
                onDateChange(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
                break;
            case 'week':
                onDateChange(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
                break;
            case 'month':
                onDateChange(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
                break;
            case 'year':
                onDateChange(direction === 'next' ? addYears(currentDate, 1) : subYears(currentDate, 1));
                break;
        }
    };

    const goToToday = () => onDateChange(new Date());

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(shift => isSameDay(new Date(shift.start_time), date));
    };

    const getShiftsForMonth = (date: Date) => {
        return shifts.filter(shift => isSameMonth(new Date(shift.start_time), date));
    };

    const getHeaderTitle = () => {
        switch (viewType) {
            case 'day':
                return format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
            case 'week':
                const weekStart = startOfWeek(currentDate);
                const weekEnd = endOfWeek(currentDate);
                return `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
            case 'month':
                return format(currentDate, 'MMMM yyyy', { locale: ptBR });
            case 'year':
                return format(currentDate, 'yyyy');
        }
    };

    // Render shift card
    const renderShiftCard = (shift: Shift, compact = false) => {
        const startTime = format(new Date(shift.start_time), 'HH:mm');
        const endTime = format(new Date(shift.end_time), 'HH:mm');
        const sectorColor = shift.sectors?.color || '#94a3b8';

        if (compact) {
            return (
                <div
                    key={shift.id}
                    className="text-[10px] px-1 py-0.5 rounded truncate"
                    style={{ backgroundColor: `${sectorColor}20`, borderLeft: `2px solid ${sectorColor}` }}
                    title={`${startTime}-${endTime} ${shift.medical_staff?.name || 'Em Aberto'}`}
                >
                    {shift.medical_staff?.name?.split(' ')[0] || 'Aberto'}
                </div>
            );
        }

        return (
            <div
                key={shift.id}
                className={cn(
                    "text-left text-xs p-1.5 rounded border shadow-sm",
                    !shift.staff_id ? "bg-slate-50 border-dashed border-slate-300" : "bg-white border-l-4"
                )}
                style={{ borderLeftColor: shift.staff_id ? sectorColor : undefined }}
            >
                <div className="flex items-center gap-1 font-medium text-slate-700">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {startTime} - {endTime}
                </div>
                <div className="truncate mt-0.5 font-semibold">
                    {shift.medical_staff ? shift.medical_staff.name : (
                        <span className="text-slate-400 italic flex items-center gap-1">
                            <User className="w-3 h-3" /> Em Aberto
                        </span>
                    )}
                </div>
                <div className="truncate text-[10px] text-slate-500 mt-0.5">
                    {shift.sectors?.name || 'Setor Excluído'}
                </div>
            </div>
        );
    };

    // Day View
    const renderDayView = () => {
        const dayShifts = getShiftsForDay(currentDate);
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="flex-1 overflow-auto">
                <div className="min-h-full">
                    {hours.map((hour) => {
                        const hourShifts = dayShifts.filter(shift => {
                            const shiftHour = new Date(shift.start_time).getHours();
                            return shiftHour === hour;
                        });

                        return (
                            <div key={hour} className="flex border-b min-h-[60px]">
                                <div className="w-16 flex-shrink-0 p-2 text-xs text-slate-500 border-r bg-slate-50 text-right">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                                <div className="flex-1 p-1 flex flex-col gap-1">
                                    {hourShifts.map(shift => renderShiftCard(shift))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Week View
    const renderWeekView = () => {
        const weekStart = startOfWeek(currentDate);
        const weekDaysArray = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(currentDate),
        });
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Week header */}
                <div className="grid grid-cols-8 border-b bg-slate-50">
                    <div className="w-16 border-r" />
                    {weekDaysArray.map((day) => (
                        <div 
                            key={day.toString()} 
                            className={cn(
                                "py-2 px-1 text-center border-r last:border-r-0",
                                isToday(day) && "bg-blue-50"
                            )}
                        >
                            <div className="text-xs text-slate-500">{weekDays[getDay(day)]}</div>
                            <div className={cn(
                                "text-lg font-semibold",
                                isToday(day) ? "text-blue-600" : "text-slate-700"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time grid */}
                <div className="flex-1 overflow-auto">
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 border-b min-h-[50px]">
                            <div className="w-16 p-1 text-[10px] text-slate-500 border-r bg-slate-50 text-right">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDaysArray.map((day) => {
                                const dayShifts = getShiftsForDay(day);
                                const hourShifts = dayShifts.filter(shift => {
                                    const shiftHour = new Date(shift.start_time).getHours();
                                    return shiftHour === hour;
                                });

                                return (
                                    <div 
                                        key={day.toString()} 
                                        className={cn(
                                            "border-r last:border-r-0 p-0.5",
                                            isToday(day) && "bg-blue-50/30"
                                        )}
                                    >
                                        {hourShifts.map(shift => renderShiftCard(shift, true))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Month View
    const renderMonthView = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
        });

        return (
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b bg-slate-50">
                    {weekDays.map((day) => (
                        <div key={day} className="py-2 text-center text-sm font-medium text-slate-500 border-r last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-100 gap-px">
                    {calendarDays.map((day) => {
                        const dayShifts = getShiftsForDay(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "min-h-[100px] bg-white p-1.5 flex flex-col gap-1",
                                    !isCurrentMonth && "bg-slate-50/50 text-slate-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday(day) 
                                            ? "bg-blue-600 text-white shadow-md" 
                                            : "text-slate-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayShifts.length > 3 && (
                                        <span className="text-[10px] text-slate-400">
                                            +{dayShifts.length - 3}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                                    {dayShifts.slice(0, 3).map(shift => renderShiftCard(shift, true))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Year View
    const renderYearView = () => {
        const yearStart = startOfYear(currentDate);
        const months = eachMonthOfInterval({
            start: yearStart,
            end: endOfYear(currentDate),
        });

        return (
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {months.map((month) => {
                        const monthShifts = getShiftsForMonth(month);
                        const monthStart = startOfMonth(month);
                        const monthEnd = endOfMonth(month);
                        const calendarStart = startOfWeek(monthStart);
                        const calendarEnd = endOfWeek(monthEnd);
                        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                        return (
                            <div 
                                key={month.toString()} 
                                className={cn(
                                    "border rounded-lg p-2 bg-white hover:shadow-md transition-shadow cursor-pointer",
                                    isSameMonth(month, new Date()) && "ring-2 ring-blue-500"
                                )}
                                onClick={() => {
                                    onDateChange(month);
                                    setViewType('month');
                                }}
                            >
                                <div className="text-sm font-semibold text-slate-700 mb-2 capitalize">
                                    {format(month, 'MMMM', { locale: ptBR })}
                                </div>

                                {/* Mini calendar */}
                                <div className="grid grid-cols-7 gap-px text-[8px]">
                                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                        <div key={i} className="text-center text-slate-400 font-medium">
                                            {d}
                                        </div>
                                    ))}
                                    {days.map((day) => {
                                        const hasShifts = getShiftsForDay(day).length > 0;
                                        const isCurrentMonth = isSameMonth(day, month);

                                        return (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "text-center py-0.5 rounded-sm",
                                                    !isCurrentMonth && "text-slate-300",
                                                    isToday(day) && "bg-blue-600 text-white font-bold",
                                                    hasShifts && isCurrentMonth && !isToday(day) && "bg-blue-100 text-blue-700 font-medium"
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Shifts count */}
                                <div className="mt-2 text-[10px] text-slate-500">
                                    {monthShifts.length} plantão(ões)
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full border rounded-lg shadow-sm bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                    {/* Navigation */}
                    <div className="flex items-center bg-white rounded-md border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-5 bg-slate-200" />
                        <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
                        Hoje
                    </Button>

                    <h2 className="text-lg font-semibold text-slate-800 capitalize">
                        {getHeaderTitle()}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Type Selector */}
                    <div className="flex items-center bg-white rounded-md border shadow-sm p-0.5">
                        {(['day', 'week', 'month', 'year'] as ViewType[]).map((type) => {
                            const Icon = VIEW_ICONS[type];
                            const isActive = viewType === type;

                            return (
                                <button
                                    key={type}
                                    onClick={() => setViewType(type)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                                        isActive 
                                            ? "bg-blue-600 text-white shadow-sm" 
                                            : "text-slate-600 hover:bg-slate-100"
                                    )}
                                    title={VIEW_LABELS[type]}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{VIEW_LABELS[type]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="hidden md:flex gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-200"></span>
                            <span>Plantão</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></span>
                            <span>Em Aberto</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content based on view type */}
            {viewType === 'day' && renderDayView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'month' && renderMonthView()}
            {viewType === 'year' && renderYearView()}
        </div>
    );
}
