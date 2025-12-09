/**
 * Shift Attendance Schema
 * Tipos e utilitarios para registro de presenca (check-in/check-out) de plantoes
 */

// Status derivado dos timestamps de check-in/check-out
export const ATTENDANCE_STATUS = ['not_started', 'in_progress', 'completed'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

// Tipo completo do registro de presenca (da tabela shift_attendance)
export type ShiftAttendance = {
    id: string;
    shift_id: string;
    staff_id: string;
    check_in_at: string | null;
    check_out_at: string | null;
    worked_minutes: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

// Configuracao das janelas de tempo (em minutos)
export const ATTENDANCE_TIME_WINDOWS = {
    checkIn: {
        beforeStart: 60, // 1 hora antes do inicio do plantao
        afterStart: 30, // 30 minutos apos o inicio do plantao
    },
    checkOut: {
        beforeEnd: 30, // 30 minutos antes do fim do plantao
        afterEnd: 120, // 2 horas apos o fim do plantao
    },
} as const;

/**
 * Deriva o status de presenca baseado nos timestamps
 * @param attendance Registro de presenca ou null
 * @returns Status: 'not_started' | 'in_progress' | 'completed'
 */
export function getAttendanceStatus(attendance: ShiftAttendance | null): AttendanceStatus {
    if (!attendance || !attendance.check_in_at) {
        return 'not_started';
    }
    if (attendance.check_in_at && !attendance.check_out_at) {
        return 'in_progress';
    }
    return 'completed';
}

/**
 * Labels em portugues para cada status
 */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
    not_started: 'Aguardando Entrada',
    in_progress: 'Em Andamento',
    completed: 'Concluido',
};

/**
 * Cores para cada status
 */
export const ATTENDANCE_STATUS_COLORS: Record<
    AttendanceStatus,
    { text: string; background: string }
> = {
    not_started: { text: '#6B7280', background: '#F3F4F6' },
    in_progress: { text: '#0066CC', background: '#EBF5FF' },
    completed: { text: '#10B981', background: '#D1FAE5' },
};
