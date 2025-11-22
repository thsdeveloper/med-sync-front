import { z } from 'zod';

export const sectorSchema = z.object({
    name: z
        .string()
        .min(1, 'Nome do setor é obrigatório')
        .max(100, 'Nome muito longo'),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida'),
        // Removido .default('#64748b') para evitar erro de tipagem no build
});

export type SectorFormData = z.infer<typeof sectorSchema>;

export type Sector = SectorFormData & {
    id: string;
    organization_id: string;
    created_at: string;
};

export const shiftSchema = z.object({
    sectorId: z.string().min(1, 'Setor é obrigatório'),
    staffId: z.string().optional(), // Pode ser nulo para plantão em aberto
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
    notes: z.string().optional(),
});

// Helper para validar se data final > data inicial (considerando que pode virar a noite)
// A lógica real de validação de data/hora completa será feita no componente ou em um refine mais complexo
// Por simplicidade, aqui validamos o formato.

export type ShiftFormData = z.infer<typeof shiftSchema>;

export type Shift = {
    id: string;
    organization_id: string;
    sector_id: string;
    staff_id: string | null;
    start_time: string; // ISO string from DB
    end_time: string; // ISO string from DB
    notes: string | null;
    created_at: string;
    // Joins
    sectors?: Sector;
    medical_staff?: {
        name: string;
        role: string;
        color: string;
    };
};
