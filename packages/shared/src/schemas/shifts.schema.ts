import { z } from 'zod';

export const sectorSchema = z.object({
    name: z
        .string()
        .min(1, 'Nome do setor é obrigatório')
        .max(100, 'Nome muito longo'),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
});

export type SectorFormData = z.infer<typeof sectorSchema>;

export type Sector = SectorFormData & {
    id: string;
    organization_id: string;
    created_at: string;
};

export const shiftSchema = z.object({
    sectorId: z.string().min(1, 'Setor é obrigatório'),
    staffId: z.string().optional(),
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
    notes: z.string().optional(),
});

export type ShiftFormData = z.infer<typeof shiftSchema>;

export const SHIFT_STATUS = ['pending', 'accepted', 'declined', 'swap_requested'] as const;
export type ShiftStatus = typeof SHIFT_STATUS[number];

export type Shift = {
    id: string;
    organization_id: string;
    sector_id: string;
    staff_id: string | null;
    start_time: string;
    end_time: string;
    notes: string | null;
    fixed_schedule_id: string | null;
    status: ShiftStatus;
    created_at: string;
    sectors?: Sector;
    medical_staff?: {
        name: string;
        role: string;
        color: string;
    };
};
