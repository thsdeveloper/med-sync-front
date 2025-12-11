import { z } from 'zod';

// =============================================
// Constants
// =============================================

export const PAYMENT_TYPES = ['hourly', 'fixed_per_shift'] as const;
export const PAYMENT_STATUSES = ['pending', 'approved', 'paid'] as const;

export const PAYMENT_TYPE_LABELS: Record<typeof PAYMENT_TYPES[number], string> = {
    hourly: 'Pagamento por Hora',
    fixed_per_shift: 'Pagamento Fixo por Turno',
};

export const PAYMENT_STATUS_LABELS: Record<typeof PAYMENT_STATUSES[number], string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    paid: 'Pago',
};

// =============================================
// Schemas
// =============================================

export const facilityPaymentConfigSchema = z.object({
    payment_type: z.enum(PAYMENT_TYPES, {
        message: 'Selecione o tipo de pagamento'
    }),
    hourly_rate: z.coerce
        .number()
        .positive({ message: 'Taxa horária deve ser maior que zero' })
        .optional(),
    night_shift_bonus_percent: z.coerce
        .number()
        .min(0, 'Percentual não pode ser negativo')
        .max(100, 'Percentual não pode ser maior que 100')
        .default(0),
    weekend_bonus_percent: z.coerce
        .number()
        .min(0, 'Percentual não pode ser negativo')
        .max(100, 'Percentual não pode ser maior que 100')
        .default(0),
    holiday_bonus_percent: z.coerce
        .number()
        .min(0, 'Percentual não pode ser negativo')
        .max(100, 'Percentual não pode ser maior que 100')
        .default(0),
    night_shift_start_hour: z.coerce
        .number()
        .min(0, 'Hora deve estar entre 0 e 23')
        .max(23, 'Hora deve estar entre 0 e 23')
        .default(22),
    night_shift_end_hour: z.coerce
        .number()
        .min(0, 'Hora deve estar entre 0 e 23')
        .max(23, 'Hora deve estar entre 0 e 23')
        .default(6),
    active: z.boolean().default(true),
}).refine(
    (data) => {
        // If payment_type is 'hourly', hourly_rate must be provided
        if (data.payment_type === 'hourly') {
            return data.hourly_rate !== undefined && data.hourly_rate > 0;
        }
        return true;
    },
    {
        message: 'Taxa horária é obrigatória quando o tipo de pagamento é "Por Hora"',
        path: ['hourly_rate'],
    }
);

export const shiftDurationRateSchema = z.object({
    duration_hours: z.coerce
        .number()
        .positive({ message: 'Duração deve ser maior que zero' }),
    fixed_rate: z.coerce
        .number()
        .positive({ message: 'Valor deve ser maior que zero' }),
});

export const paymentRecordSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    shift_id: z.string().uuid(),
    staff_id: z.string().uuid(),
    facility_id: z.string().uuid(),
    shift_start_time: z.string().datetime(),
    shift_end_time: z.string().datetime(),
    scheduled_minutes: z.number().positive(),
    worked_minutes: z.number().nonnegative(),
    overtime_minutes: z.number().nonnegative().default(0),
    payment_type: z.enum(PAYMENT_TYPES),
    base_rate: z.number(),
    base_amount: z.number(),
    night_shift_bonus: z.number().default(0),
    weekend_bonus: z.number().default(0),
    holiday_bonus: z.number().default(0),
    overtime_amount: z.number().default(0),
    total_amount: z.number(),
    is_night_shift: z.boolean().default(false),
    is_weekend: z.boolean().default(false),
    is_holiday: z.boolean().default(false),
    calculation_metadata: z.any().optional(),
    status: z.enum(PAYMENT_STATUSES),
    approved_by: z.string().uuid().nullable().optional(),
    approved_at: z.string().datetime().nullable().optional(),
    paid_at: z.string().datetime().nullable().optional(),
    notes: z.string().nullable().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// =============================================
// Types
// =============================================

export type FacilityPaymentConfigFormData = z.infer<typeof facilityPaymentConfigSchema>;

export type FacilityPaymentConfig = FacilityPaymentConfigFormData & {
    id: string;
    facility_id: string;
    created_at: string;
    updated_at: string;
};

export type ShiftDurationRateFormData = z.infer<typeof shiftDurationRateSchema>;

export type ShiftDurationRate = ShiftDurationRateFormData & {
    id: string;
    facility_payment_config_id: string;
    created_at: string;
};

export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

// For form submission with shift duration rates
export type PaymentConfigWithRates = {
    config: FacilityPaymentConfigFormData;
    duration_rates: ShiftDurationRateFormData[];
};

// Extended payment record with related data for display
export type PaymentRecordWithDetails = PaymentRecord & {
    staff?: {
        id: string;
        name: string;
        crm?: string;
        specialty?: string;
    };
    facility?: {
        id: string;
        name: string;
        type: string;
    };
};

// Calculation metadata structure
export type PaymentCalculationMetadata = {
    calculation_date: string;
    scheduled_hours: number;
    worked_hours: number;
    overtime_hours: number;
    base_calculation: {
        rate: number;
        amount: number;
    };
    bonuses: {
        night_shift: {
            applied: boolean;
            percent: number;
            amount: number;
        };
        weekend: {
            applied: boolean;
            percent: number;
            amount: number;
        };
        holiday: {
            applied: boolean;
            percent: number;
            amount: number;
        };
    };
    overtime: {
        minutes: number;
        amount: number;
    };
};
