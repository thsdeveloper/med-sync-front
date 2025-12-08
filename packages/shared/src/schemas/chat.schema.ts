import { z } from 'zod';

export const CONVERSATION_TYPES = ['direct', 'group'] as const;
export type ConversationType = typeof CONVERSATION_TYPES[number];

// Schema for creating a new conversation
export const createConversationSchema = z.object({
    organization_id: z.string().uuid('ID da organização inválido'),
    type: z.enum(CONVERSATION_TYPES),
    name: z.string().max(100, 'Nome muito longo').optional().or(z.literal('')),
    participant_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um participante'),
});

export type CreateConversationData = z.infer<typeof createConversationSchema>;

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
};
