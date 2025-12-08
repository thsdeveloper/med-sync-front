import { z } from 'zod';

export const RESPONSE_TYPES = ['accepted', 'declined', 'pending'] as const;
export type ResponseType = typeof RESPONSE_TYPES[number];

// Schema for creating/updating a shift response
export const shiftResponseSchema = z.object({
    shift_id: z.string().uuid('ID da escala inválido'),
    response: z.enum(RESPONSE_TYPES),
    notes: z.string().optional().or(z.literal('')),
});

export type ShiftResponseFormData = z.infer<typeof shiftResponseSchema>;

// Full shift response type (from database)
export type ShiftResponse = {
    id: string;
    shift_id: string;
    staff_id: string;
    response: ResponseType;
    responded_at: string | null;
    notes: string | null;
    created_at: string;
};

// Shift response with related data
export type ShiftResponseWithDetails = ShiftResponse & {
    shift?: {
        id: string;
        start_time: string;
        end_time: string;
        status: string;
        sectors?: {
            name: string;
            color: string;
        };
    };
    medical_staff?: {
        id: string;
        name: string;
        color: string;
    };
};
