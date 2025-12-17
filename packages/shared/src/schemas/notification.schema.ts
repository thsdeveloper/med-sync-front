import { z } from 'zod';
import type { ShiftSwapRequestWithDetails } from './shift-swap.schema';

// Tipos de notificação disponíveis
export const NOTIFICATION_TYPES = [
    'shift_swap_request',        // Nova solicitação de troca recebida
    'shift_swap_accepted',       // Médico B aceitou (vai para admin)
    'shift_swap_rejected',       // Médico B rejeitou
    'shift_swap_admin_approved', // Admin aprovou (vai para ambos médicos)
    'shift_swap_admin_rejected', // Admin rejeitou
    'shift_assigned',            // Nova escala atribuída
    'shift_reminder',            // Lembrete de escala
    'document_accepted',         // Documento anexado foi aprovado pelo admin
    'document_rejected',         // Documento anexado foi rejeitado pelo admin
    'general'                    // Notificação geral
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Schema de validação para criar notificação
export const notificationSchema = z.object({
    organization_id: z.string().uuid('ID da organização inválido'),
    user_id: z.string().uuid('ID do usuário inválido').optional().nullable(),
    staff_id: z.string().uuid('ID do profissional inválido').optional().nullable(),
    type: z.enum(NOTIFICATION_TYPES),
    title: z.string().min(1, 'Título obrigatório').max(200, 'Título muito longo'),
    body: z.string().min(1, 'Corpo obrigatório').max(1000, 'Corpo muito longo'),
    data: z.record(z.string(), z.unknown()).optional().default({}),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;

// Tipo completo da notificação (do banco de dados)
export type Notification = {
    id: string;
    organization_id: string;
    user_id: string | null;
    staff_id: string | null;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, unknown>;
    read: boolean;
    read_at: string | null;
    created_at: string;
};

// Notificação com detalhes expandidos para exibição
export type NotificationWithDetails = Notification & {
    // Dados expandidos dependendo do tipo
    swap_request?: ShiftSwapRequestWithDetails;
};

// Helper para verificar se é notificação de swap
export function isSwapNotification(type: NotificationType): boolean {
    return type.startsWith('shift_swap_');
}

// Helper para verificar se é notificação de documento
export function isDocumentNotification(type: NotificationType): boolean {
    return type.startsWith('document_');
}

// Labels amigáveis para os tipos de notificação
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    'shift_swap_request': 'Solicitação de Troca',
    'shift_swap_accepted': 'Troca Aceita',
    'shift_swap_rejected': 'Troca Recusada',
    'shift_swap_admin_approved': 'Troca Aprovada',
    'shift_swap_admin_rejected': 'Troca Rejeitada',
    'shift_assigned': 'Nova Escala',
    'shift_reminder': 'Lembrete de Escala',
    'document_accepted': 'Documento Aprovado',
    'document_rejected': 'Documento Rejeitado',
    'general': 'Notificação'
};
