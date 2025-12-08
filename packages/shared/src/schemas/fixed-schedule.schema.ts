import { z } from 'zod';
import type { Facility } from './facility.schema';
import type { MedicalStaff } from './medical-staff.schema';
import type { Sector } from './shifts.schema';

export const SHIFT_TYPES = ['morning', 'afternoon', 'night'] as const;
export type ShiftType = typeof SHIFT_TYPES[number];

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
};

export const SHIFT_TYPE_TIMES: Record<ShiftType, { start: string; end: string }> = {
    morning: { start: '07:00', end: '12:00' },
    afternoon: { start: '12:00', end: '18:00' },
    night: { start: '18:00', end: '07:00' },
};

export const DURATION_TYPES = ['weekly', 'monthly', 'yearly', 'permanent'] as const;
export type DurationType = typeof DURATION_TYPES[number];

export const DURATION_TYPE_LABELS: Record<DurationType, string> = {
    weekly: 'Semanal',
    monthly: 'Mensal',
    yearly: 'Anual',
    permanent: 'Permanente',
};

export const WEEKDAYS = [
    { value: 0, label: 'Dom', fullLabel: 'Domingo' },
    { value: 1, label: 'Seg', fullLabel: 'Segunda' },
    { value: 2, label: 'Ter', fullLabel: 'Terça' },
    { value: 3, label: 'Qua', fullLabel: 'Quarta' },
    { value: 4, label: 'Qui', fullLabel: 'Quinta' },
    { value: 5, label: 'Sex', fullLabel: 'Sexta' },
    { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
] as const;

const fixedScheduleBaseSchema = z.object({
    facilityId: z.string().min(1, 'Selecione uma unidade'),
    staffId: z.string().min(1, 'Selecione um profissional'),
    sectorId: z.string().optional(),
    shiftType: z.enum(SHIFT_TYPES, { message: 'Selecione um turno' }),
    durationType: z.enum(DURATION_TYPES, { message: 'Selecione a duração' }),
    startDate: z.date({ message: 'Data de início é obrigatória' }),
    endDate: z.date().optional().nullable(),
    weekdays: z
        .array(z.number().min(0).max(6))
        .min(1, 'Selecione pelo menos um dia da semana'),
    active: z.boolean(),
});

export const fixedScheduleSchema = fixedScheduleBaseSchema.refine(
    (data) => {
        if (data.durationType !== 'permanent' && !data.endDate) {
            return false;
        }
        return true;
    },
    {
        message: 'Data de término é obrigatória para duração não permanente',
        path: ['endDate'],
    }
).refine(
    (data) => {
        if (data.endDate && data.startDate && data.endDate < data.startDate) {
            return false;
        }
        return true;
    },
    {
        message: 'Data de término deve ser posterior à data de início',
        path: ['endDate'],
    }
);

export type FixedScheduleFormData = z.infer<typeof fixedScheduleBaseSchema>;

export type FixedSchedule = {
    id: string;
    organization_id: string;
    facility_id: string;
    staff_id: string;
    sector_id: string | null;
    shift_type: ShiftType;
    duration_type: DurationType;
    start_date: string;
    end_date: string | null;
    weekdays: number[];
    active: boolean;
    created_at: string;
    updated_at: string;
    facilities?: Facility;
    medical_staff?: Pick<MedicalStaff, 'id' | 'name' | 'role' | 'color'>;
    sectors?: Sector;
};

export type FixedScheduleConflict = {
    conflicting_id: string;
    facility_name: string;
    conflicting_weekdays: number[];
};
