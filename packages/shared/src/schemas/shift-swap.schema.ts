import { z } from 'zod';

export const SWAP_STATUS = ['pending', 'accepted', 'declined', 'cancelled'] as const;
export type SwapStatus = typeof SWAP_STATUS[number];

// Schema for creating a swap request
export const shiftSwapRequestSchema = z.object({
    original_shift_id: z.string().uuid('ID da escala original inválido'),
    target_shift_id: z.string().uuid('ID da escala alvo inválido').optional().or(z.literal('')),
    target_staff_id: z.string().uuid('ID do médico alvo inválido').optional().or(z.literal('')),
    requester_notes: z.string().max(500, 'Notas muito longas').optional().or(z.literal('')),
});

export type ShiftSwapRequestFormData = z.infer<typeof shiftSwapRequestSchema>;

// Schema for responding to a swap request
export const shiftSwapResponseSchema = z.object({
    status: z.enum(['accepted', 'declined']),
    responder_notes: z.string().max(500, 'Notas muito longas').optional().or(z.literal('')),
});

export type ShiftSwapResponseFormData = z.infer<typeof shiftSwapResponseSchema>;

// Full swap request type (from database)
export type ShiftSwapRequest = {
    id: string;
    requester_id: string;
    original_shift_id: string;
    target_shift_id: string | null;
    target_staff_id: string | null;
    status: SwapStatus;
    requester_notes: string | null;
    responder_notes: string | null;
    created_at: string;
    responded_at: string | null;
};

// Swap request with related data for display
export type ShiftSwapRequestWithDetails = ShiftSwapRequest & {
    requester?: {
        id: string;
        name: string;
        color: string;
        specialty?: string | null;
    };
    target_staff?: {
        id: string;
        name: string;
        color: string;
        specialty?: string | null;
    } | null;
    original_shift?: {
        id: string;
        start_time: string;
        end_time: string;
        status: string;
        sectors?: {
            name: string;
            color: string;
        };
    };
    target_shift?: {
        id: string;
        start_time: string;
        end_time: string;
        status: string;
        sectors?: {
            name: string;
            color: string;
        };
    } | null;
};
