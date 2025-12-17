import { z } from 'zod';

export const CONVERSATION_TYPES = ['direct', 'group'] as const;
export type ConversationType = typeof CONVERSATION_TYPES[number];

// Tipo de conversa: staff (entre profissionais) ou support (profissional para admin)
export const CONVERSATION_CATEGORY_TYPES = ['staff', 'support'] as const;
export type ConversationCategoryType = typeof CONVERSATION_CATEGORY_TYPES[number];

// Schema for creating a new conversation
export const createConversationSchema = z.object({
    organization_id: z.string().uuid('ID da organização inválido'),
    type: z.enum(CONVERSATION_TYPES),
    name: z.string().max(100, 'Nome muito longo').optional().or(z.literal('')),
    participant_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um participante'),
});

// Schema for creating a support conversation (staff to admin)
export const createSupportConversationSchema = z.object({
    organization_id: z.string().uuid('ID da organização inválido'),
    name: z.string().max(100, 'Nome muito longo').optional().or(z.literal('')),
});

export type CreateConversationData = z.infer<typeof createConversationSchema>;
export type CreateSupportConversationData = z.infer<typeof createSupportConversationSchema>;

// Schema for sending a message
export const sendMessageSchema = z.object({
    conversation_id: z.string().uuid('ID da conversa inválido'),
    content: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
});

export type SendMessageData = z.infer<typeof sendMessageSchema>;

// Conversation type (from database)
export type ChatConversation = {
    id: string;
    organization_id: string;
    type: ConversationType;
    conversation_type: ConversationCategoryType;
    name: string | null;
    created_at: string;
    updated_at: string;
};

// Participant type (from database)
export type ChatParticipant = {
    id: string;
    conversation_id: string;
    staff_id: string;
    joined_at: string;
    last_read_at: string | null;
};

// Message type (from database)
export type ChatMessage = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

// Conversation with participants and last message for list display
export type ConversationWithDetails = ChatConversation & {
    participants: Array<{
        staff_id: string;
        staff?: {
            id: string;
            name: string;
            color: string;
        };
    }>;
    last_message?: {
        id: string;
        content: string;
        created_at: string;
        sender?: {
            id: string;
            name: string;
        };
    } | null;
    unread_count?: number;
};

// Message with sender info for display
export type MessageWithSender = ChatMessage & {
    sender?: {
        id: string;
        name: string;
        color: string;
    };
    is_own?: boolean;
    attachments?: ChatAttachment[];
};

// Admin participant type (for support conversations)
export type ChatAdminParticipant = {
    id: string;
    conversation_id: string;
    user_id: string;
    last_read_at: string | null;
    created_at: string;
};

// Organization info for support chat selection
export type OrganizationForChat = {
    id: string;
    name: string;
    logo_url: string | null;
};

// Conversation with details including admin participants
export type SupportConversationWithDetails = ChatConversation & {
    participants: Array<{
        staff_id: string;
        staff?: {
            id: string;
            name: string;
            color: string;
        };
    }>;
    admin_participants?: Array<{
        user_id: string;
        last_read_at: string | null;
    }>;
    organization?: {
        id: string;
        name: string;
        logo_url: string | null;
    };
    last_message?: {
        id: string;
        content: string;
        created_at: string;
        sender?: {
            id: string;
            name: string;
        };
    } | null;
    unread_count?: number;
};

// Message with sender for admin view (sender can be staff or admin)
export type AdminMessageWithSender = ChatMessage & {
    sender?: {
        id: string;
        name: string;
        color: string;
        type: 'staff' | 'admin';
    };
    is_own?: boolean;
    attachments?: ChatAttachment[];
};

// ============================================================================
// Document Attachment Types and Schemas
// ============================================================================

/**
 * Attachment status enum
 * - pending: Document uploaded, awaiting admin review
 * - accepted: Document approved by admin, visible to all participants
 * - rejected: Document rejected by admin with reason
 */
export const ATTACHMENT_STATUS = ['pending', 'accepted', 'rejected'] as const;
export type AttachmentStatus = typeof ATTACHMENT_STATUS[number];

/**
 * File type enum
 * - pdf: PDF document
 * - image: Image file (jpg, jpeg, png, gif)
 */
export const FILE_TYPE = ['pdf', 'image'] as const;
export type FileType = typeof FILE_TYPE[number];

/**
 * Allowed file extensions for attachments
 */
export const ALLOWED_FILE_EXTENSIONS = {
    pdf: ['.pdf'],
    image: ['.jpg', '.jpeg', '.png', '.gif'],
} as const;

/**
 * File size limits in bytes
 * Max file size: 10MB
 */
export const MAX_FILE_SIZE = 10485760; // 10MB in bytes
export const MAX_FILE_SIZE_MB = 10;

/**
 * Chat attachment type (from database)
 */
export type ChatAttachment = {
    id: string;
    conversation_id: string;
    message_id: string | null;
    sender_id: string;
    file_name: string;
    file_type: FileType;
    file_path: string;
    file_size: number;
    status: AttachmentStatus;
    rejected_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
};

/**
 * Schema for uploading a document attachment
 * Validates file metadata before upload
 */
export const uploadAttachmentSchema = z.object({
    conversation_id: z.string().uuid('ID da conversa inválido'),
    message_id: z.string().uuid('ID da mensagem inválido').optional().nullable(),
    file_name: z.string()
        .min(1, 'Nome do arquivo é obrigatório')
        .max(255, 'Nome do arquivo muito longo')
        .refine(
            (name) => {
                const ext = name.toLowerCase().match(/\.[^.]+$/)?.[0];
                if (!ext) return false;
                const allExtensions: string[] = [
                    ...ALLOWED_FILE_EXTENSIONS.pdf,
                    ...ALLOWED_FILE_EXTENSIONS.image,
                ];
                return allExtensions.includes(ext);
            },
            {
                message: 'Tipo de arquivo não permitido. Use PDF, JPG, JPEG, PNG ou GIF',
            }
        ),
    file_type: z.enum(FILE_TYPE, {
        message: 'Tipo de arquivo deve ser "pdf" ou "image"',
    }),
    file_size: z.number()
        .int('Tamanho do arquivo deve ser um número inteiro')
        .positive('Tamanho do arquivo deve ser maior que zero')
        .max(MAX_FILE_SIZE, `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB}MB`),
});

export type UploadAttachmentData = z.infer<typeof uploadAttachmentSchema>;

/**
 * Schema for updating attachment status (admin review action)
 * Admins can accept or reject documents
 */
export const updateAttachmentStatusSchema = z.object({
    attachment_id: z.string().uuid('ID do anexo inválido'),
    status: z.enum(['accepted', 'rejected'] as const, {
        message: 'Status deve ser "accepted" ou "rejected"',
    }),
    rejected_reason: z.string()
        .max(500, 'Motivo da rejeição muito longo')
        .optional()
        .nullable(),
}).refine(
    (data) => {
        // If status is 'rejected', rejected_reason is required
        if (data.status === 'rejected' && (!data.rejected_reason || data.rejected_reason.trim().length === 0)) {
            return false;
        }
        return true;
    },
    {
        message: 'Motivo da rejeição é obrigatório quando o documento é rejeitado',
        path: ['rejected_reason'],
    }
);

export type UpdateAttachmentStatusData = z.infer<typeof updateAttachmentStatusSchema>;

/**
 * Chat attachment with sender info for display
 */
export type AttachmentWithSender = ChatAttachment & {
    sender?: {
        id: string;
        name: string;
        color: string;
    };
};
