import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    isWithinInterval,
    addMinutes,
    subMinutes,
    parseISO,
    differenceInMinutes,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type {
    ShiftAttendance,
    AttendanceStatus,
} from '@medsync/shared';
import {
    getAttendanceStatus,
    ATTENDANCE_TIME_WINDOWS,
} from '@medsync/shared';

/**
 * Resultado do calculo das janelas de tempo
 */
interface TimeWindowResult {
    canCheckIn: boolean;
    canCheckOut: boolean;
    checkInWindowStart: Date;
    checkInWindowEnd: Date;
    checkOutWindowStart: Date;
    checkOutWindowEnd: Date;
    isBeforeCheckInWindow: boolean;
    isAfterCheckInWindow: boolean;
    isBeforeCheckOutWindow: boolean;
    isAfterCheckOutWindow: boolean;
    minutesUntilCheckIn: number | null;
    minutesUntilCheckOut: number | null;
}

/**
 * Opcoes do hook
 */
interface UseShiftAttendanceOptions {
    shiftId: string;
    shiftStartTime: string;
    shiftEndTime: string;
    shiftStatus: string;
}

/**
 * Retorno do hook
 */
interface UseShiftAttendanceReturn {
    attendance: ShiftAttendance | null;
    attendanceStatus: AttendanceStatus;
    timeWindow: TimeWindowResult;
    isLoading: boolean;
    isCheckingIn: boolean;
    isCheckingOut: boolean;
    error: string | null;
    checkIn: () => Promise<boolean>;
    checkOut: () => Promise<boolean>;
    refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar check-in/check-out de plantoes
 */
export function useShiftAttendance(
    options: UseShiftAttendanceOptions
): UseShiftAttendanceReturn {
    const { shiftId, shiftStartTime, shiftEndTime, shiftStatus } = options;
    const { staff } = useAuth();

    const [attendance, setAttendance] = useState<ShiftAttendance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calcular janelas de tempo
    const timeWindow = useMemo((): TimeWindowResult => {
        const now = new Date();

        // Validar se as datas sao validas
        if (!shiftStartTime || !shiftEndTime) {
            return {
                canCheckIn: false,
                canCheckOut: false,
                checkInWindowStart: now,
                checkInWindowEnd: now,
                checkOutWindowStart: now,
                checkOutWindowEnd: now,
                isBeforeCheckInWindow: false,
                isAfterCheckInWindow: false,
                isBeforeCheckOutWindow: false,
                isAfterCheckOutWindow: false,
                minutesUntilCheckIn: null,
                minutesUntilCheckOut: null,
            };
        }

        const startTime = parseISO(shiftStartTime);
        const endTime = parseISO(shiftEndTime);

        // Janela de check-in: 1h antes ate 30min apos inicio
        const checkInWindowStart = subMinutes(
            startTime,
            ATTENDANCE_TIME_WINDOWS.checkIn.beforeStart
        );
        const checkInWindowEnd = addMinutes(
            startTime,
            ATTENDANCE_TIME_WINDOWS.checkIn.afterStart
        );

        // Janela de check-out: 30min antes ate 2h apos fim
        const checkOutWindowStart = subMinutes(
            endTime,
            ATTENDANCE_TIME_WINDOWS.checkOut.beforeEnd
        );
        const checkOutWindowEnd = addMinutes(
            endTime,
            ATTENDANCE_TIME_WINDOWS.checkOut.afterEnd
        );

        // Verificar se esta dentro das janelas
        const isWithinCheckInWindow = isWithinInterval(now, {
            start: checkInWindowStart,
            end: checkInWindowEnd,
        });

        const isWithinCheckOutWindow = isWithinInterval(now, {
            start: checkOutWindowStart,
            end: checkOutWindowEnd,
        });

        return {
            canCheckIn: isWithinCheckInWindow && shiftStatus === 'accepted',
            canCheckOut: isWithinCheckOutWindow,
            checkInWindowStart,
            checkInWindowEnd,
            checkOutWindowStart,
            checkOutWindowEnd,
            isBeforeCheckInWindow: now < checkInWindowStart,
            isAfterCheckInWindow: now > checkInWindowEnd,
            isBeforeCheckOutWindow: now < checkOutWindowStart,
            isAfterCheckOutWindow: now > checkOutWindowEnd,
            minutesUntilCheckIn:
                now < checkInWindowStart
                    ? differenceInMinutes(checkInWindowStart, now)
                    : null,
            minutesUntilCheckOut:
                now < checkOutWindowStart
                    ? differenceInMinutes(checkOutWindowStart, now)
                    : null,
        };
    }, [shiftStartTime, shiftEndTime, shiftStatus]);

    // Buscar registro de presenca existente
    const fetchAttendance = useCallback(async () => {
        if (!staff?.id || !shiftId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('shift_attendance')
                .select('*')
                .eq('shift_id', shiftId)
                .eq('staff_id', staff.id)
                .maybeSingle();

            if (fetchError) throw fetchError;
            setAttendance(data);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError('Erro ao carregar registro de presenca');
        } finally {
            setIsLoading(false);
        }
    }, [shiftId, staff?.id]);

    // Realizar check-in
    const checkIn = useCallback(async (): Promise<boolean> => {
        if (!staff?.id || !shiftId) {
            setError('Dados de usuario nao disponiveis');
            return false;
        }

        if (!timeWindow.canCheckIn) {
            setError('Check-in nao disponivel neste momento');
            return false;
        }

        if (attendance?.check_in_at) {
            setError('Check-in ja realizado');
            return false;
        }

        setIsCheckingIn(true);
        setError(null);

        try {
            const now = new Date().toISOString();

            const { data, error: insertError } = await supabase
                .from('shift_attendance')
                .upsert({
                    shift_id: shiftId,
                    staff_id: staff.id,
                    check_in_at: now,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setAttendance(data);
            return true;
        } catch (err) {
            console.error('Error checking in:', err);
            setError('Erro ao realizar check-in');
            return false;
        } finally {
            setIsCheckingIn(false);
        }
    }, [staff?.id, shiftId, timeWindow.canCheckIn, attendance?.check_in_at]);

    // Realizar check-out
    const checkOut = useCallback(async (): Promise<boolean> => {
        if (!staff?.id || !attendance?.id) {
            setError('Dados de presenca nao disponiveis');
            return false;
        }

        if (!attendance.check_in_at) {
            setError('E necessario fazer check-in primeiro');
            return false;
        }

        if (attendance.check_out_at) {
            setError('Check-out ja realizado');
            return false;
        }

        if (!timeWindow.canCheckOut) {
            setError('Check-out nao disponivel neste momento');
            return false;
        }

        setIsCheckingOut(true);
        setError(null);

        try {
            const now = new Date();
            const checkInTime = parseISO(attendance.check_in_at);
            const workedMinutes = differenceInMinutes(now, checkInTime);

            const { data, error: updateError } = await supabase
                .from('shift_attendance')
                .update({
                    check_out_at: now.toISOString(),
                    worked_minutes: workedMinutes,
                })
                .eq('id', attendance.id)
                .select()
                .single();

            if (updateError) throw updateError;

            setAttendance(data);
            return true;
        } catch (err) {
            console.error('Error checking out:', err);
            setError('Erro ao realizar check-out');
            return false;
        } finally {
            setIsCheckingOut(false);
        }
    }, [staff?.id, attendance, timeWindow.canCheckOut]);

    // Derivar status de presenca
    const attendanceStatus = useMemo(
        () => getAttendanceStatus(attendance),
        [attendance]
    );

    // Buscar dados iniciais
    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    return {
        attendance,
        attendanceStatus,
        timeWindow,
        isLoading,
        isCheckingIn,
        isCheckingOut,
        error,
        checkIn,
        checkOut,
        refetch: fetchAttendance,
    };
}
