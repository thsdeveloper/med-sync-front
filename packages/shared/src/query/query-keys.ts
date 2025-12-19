/**
 * Query Keys Factory
 *
 * Centralized query keys for React Query cache management.
 * Following the factory pattern for hierarchical, type-safe query keys.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/community/lukemorales-query-key-factory
 */

// Filter types for complex queries
export interface ShiftFilters {
  startDate?: string;
  endDate?: string;
  facilityId?: string;
  sectorId?: string;
  staffId?: string;
  status?: string[];
  shiftType?: string;
  assignmentStatus?: string;
  scheduleType?: string;
}

export interface ConversationFilters {
  type?: 'direct' | 'group';
  unreadOnly?: boolean;
}

export interface MessageFilters {
  beforeId?: string;
  afterId?: string;
  limit?: number;
}

/**
 * Query keys factory for consistent cache key management across web and mobile.
 */
export const queryKeys = {
  // ============================================
  // CHAT
  // ============================================
  chat: {
    all: ['chat'] as const,

    // Conversations
    conversations: {
      all: () => [...queryKeys.chat.all, 'conversations'] as const,
      list: (userId: string, filters?: ConversationFilters) =>
        [...queryKeys.chat.conversations.all(), userId, filters ?? {}] as const,
      detail: (conversationId: string) =>
        [...queryKeys.chat.conversations.all(), 'detail', conversationId] as const,
      // Support conversations (admin view)
      support: (organizationId: string, userId: string) =>
        [...queryKeys.chat.conversations.all(), 'support', organizationId, userId] as const,
    },

    // Messages
    messages: {
      all: () => [...queryKeys.chat.all, 'messages'] as const,
      list: (conversationId: string, filters?: MessageFilters) =>
        [...queryKeys.chat.messages.all(), conversationId, filters ?? {}] as const,
      infinite: (conversationId: string) =>
        [...queryKeys.chat.messages.all(), 'infinite', conversationId] as const,
    },

    // Attachments
    attachments: {
      all: () => [...queryKeys.chat.all, 'attachments'] as const,
      list: (conversationId: string) =>
        [...queryKeys.chat.attachments.all(), conversationId] as const,
      detail: (attachmentId: string) =>
        [...queryKeys.chat.attachments.all(), 'detail', attachmentId] as const,
      pending: (organizationId: string) =>
        [...queryKeys.chat.attachments.all(), 'pending', organizationId] as const,
    },
  },

  // ============================================
  // MEDICAL STAFF
  // ============================================
  medicalStaff: {
    all: ['medical-staff'] as const,

    lists: () => [...queryKeys.medicalStaff.all, 'list'] as const,
    list: (organizationId: string) =>
      [...queryKeys.medicalStaff.lists(), organizationId] as const,

    details: () => [...queryKeys.medicalStaff.all, 'detail'] as const,
    detail: (staffId: string, organizationId: string) =>
      [...queryKeys.medicalStaff.details(), staffId, organizationId] as const,

    // For shifts assignment
    forShifts: (organizationId: string) =>
      [...queryKeys.medicalStaff.all, 'for-shifts', organizationId] as const,
  },

  // ============================================
  // SHIFTS
  // ============================================
  shifts: {
    all: ['shifts'] as const,

    lists: () => [...queryKeys.shifts.all, 'list'] as const,
    list: (organizationId: string, filters?: ShiftFilters) =>
      [...queryKeys.shifts.lists(), organizationId, filters ?? {}] as const,

    calendar: (organizationId: string, filters: ShiftFilters) =>
      [...queryKeys.shifts.all, 'calendar', organizationId, filters] as const,

    details: () => [...queryKeys.shifts.all, 'detail'] as const,
    detail: (shiftId: string) =>
      [...queryKeys.shifts.details(), shiftId] as const,

    // Staff's own shifts
    myShifts: (staffId: string, filters?: ShiftFilters) =>
      [...queryKeys.shifts.all, 'my-shifts', staffId, filters ?? {}] as const,

    // Attendance
    attendance: {
      all: () => [...queryKeys.shifts.all, 'attendance'] as const,
      byShift: (shiftId: string) =>
        [...queryKeys.shifts.attendance.all(), shiftId] as const,
      byStaff: (staffId: string) =>
        [...queryKeys.shifts.attendance.all(), 'staff', staffId] as const,
    },
  },

  // ============================================
  // SHIFT SWAP REQUESTS
  // ============================================
  swapRequests: {
    all: ['swap-requests'] as const,

    lists: () => [...queryKeys.swapRequests.all, 'list'] as const,
    list: (organizationId: string) =>
      [...queryKeys.swapRequests.lists(), organizationId] as const,

    // Requests targeting me
    incoming: (staffId: string) =>
      [...queryKeys.swapRequests.all, 'incoming', staffId] as const,

    // Requests I made
    outgoing: (staffId: string) =>
      [...queryKeys.swapRequests.all, 'outgoing', staffId] as const,

    detail: (requestId: string) =>
      [...queryKeys.swapRequests.all, 'detail', requestId] as const,
  },

  // ============================================
  // ORGANIZATIONS & FACILITIES
  // ============================================
  organizations: {
    all: ['organizations'] as const,
    detail: (organizationId: string) =>
      [...queryKeys.organizations.all, 'detail', organizationId] as const,
    settings: (organizationId: string) =>
      [...queryKeys.organizations.all, 'settings', organizationId] as const,
  },

  facilities: {
    all: ['facilities'] as const,
    list: (organizationId: string) =>
      [...queryKeys.facilities.all, organizationId] as const,
    detail: (facilityId: string) =>
      [...queryKeys.facilities.all, 'detail', facilityId] as const,
  },

  sectors: {
    all: ['sectors'] as const,
    list: (organizationId: string) =>
      [...queryKeys.sectors.all, organizationId] as const,
  },

  // ============================================
  // REFERENCE DATA (cached longer)
  // ============================================
  especialidades: {
    all: ['especialidades'] as const,
    list: (search?: string) =>
      [...queryKeys.especialidades.all, search ?? ''] as const,
  },

  profissoes: {
    all: ['profissoes'] as const,
    list: (search?: string) =>
      [...queryKeys.profissoes.all, search ?? ''] as const,
  },

  conselhos: {
    all: ['conselhos'] as const,
    list: () => [...queryKeys.conselhos.all, 'list'] as const,
  },
} as const;

// Type helpers for query key inference
export type QueryKeys = typeof queryKeys;
export type ChatQueryKeys = QueryKeys['chat'];
export type MedicalStaffQueryKeys = QueryKeys['medicalStaff'];
export type ShiftsQueryKeys = QueryKeys['shifts'];
