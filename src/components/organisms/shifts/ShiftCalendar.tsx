'use client';

import { 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    format, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Shift, Sector } from '@/schemas/shifts.schema';
import { cn } from '@/lib/utils'; // shadcn utility usually available

interface ShiftCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    shifts: Shift[];
    sectors: Sector[];
    onAddShift: (date: Date) => void;
    onEditShift: (shift: Shift) => void;
    isLoading?: boolean;
}

export function ShiftCalendar({
    currentDate,
    onDateChange,
    shifts,
    sectors,
    onAddShift,
    onEditShift,
    isLoading
}: ShiftCalendarProps) {
    
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const nextMonth = () => onDateChange(addMonths(currentDate, 1));
    const prevMonth = () => onDateChange(subMonths(currentDate, 1));
    const goToToday = () => onDateChange(new Date());

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(shift => isSameDay(new Date(shift.start_time), date));
    };

    return (
        <div className="flex flex-col h-full border rounded-lg shadow-sm bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-slate-800 capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <div className="flex items-center bg-white rounded-md border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-slate-200" />
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                </div>
                
                <div className="flex gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></span>
                        <span>Plantão</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></span>
                        <span>Em Aberto</span>
                    </div>
                </div>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b bg-slate-50">
                {weekDays.map((day) => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-slate-500 border-r last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-100 gap-px border-b">
                {calendarDays.map((day, dayIdx) => {
                    const dayShifts = getShiftsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[120px] bg-white p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50/50 group relative",
                                !isCurrentMonth && "bg-slate-50/50 text-slate-400"
                            )}
                            onClick={() => onAddShift(day)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                    isToday(day) 
                                        ? "bg-blue-600 text-white shadow-md" 
                                        : "text-slate-700"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                >
                                    <div className="text-xs">+</div>
                                </Button>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                                {dayShifts.map((shift) => {
                                    const startTime = format(new Date(shift.start_time), 'HH:mm');
                                    const endTime = format(new Date(shift.end_time), 'HH:mm');
                                    const sectorColor = shift.sectors?.color || '#94a3b8';
                                    
                                    return (
                                        <button
                                            key={shift.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditShift(shift);
                                            }}
                                            className={cn(
                                                "text-left text-xs p-1.5 rounded border shadow-sm transition-all hover:brightness-95",
                                                !shift.staff_id ? "bg-slate-50 border-dashed border-slate-300" : "bg-white border-l-4"
                                            )}
                                            style={{ 
                                                borderLeftColor: shift.staff_id ? sectorColor : undefined 
                                            }}
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
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

