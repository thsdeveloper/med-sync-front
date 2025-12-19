/**
 * Chat UI Store (Zustand)
 *
 * Manages client-side chat UI state that doesn't come from the server.
 * This includes drafts, typing indicators, unread counts, and selection state.
 *
 * This store is platform-agnostic and works with both web (localStorage)
 * and mobile (AsyncStorage) through Zustand's persist middleware.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export interface DraftMessage {
  text: string;
  attachmentPaths?: string[];
  updatedAt: number;
}

export interface ChatUIState {
  // Current selection
  selectedConversationId: string | null;

  // Draft messages (unsaved message text per conversation)
  draftMessages: Record<string, DraftMessage>;

  // Typing indicators from other users (received via realtime)
  typingUsers: Record<string, string[]>; // conversationId -> userId[]

  // Local unread counts (cache before server sync)
  unreadCounts: Record<string, number>;

  // UI state
  isChatOpen: boolean;
  chatSearchQuery: string;

  // Actions
  selectConversation: (id: string | null) => void;
  setDraft: (conversationId: string, text: string, attachmentPaths?: string[]) => void;
  clearDraft: (conversationId: string) => void;
  getDraft: (conversationId: string) => DraftMessage | undefined;
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  clearTypingUsers: (conversationId: string) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
  getTotalUnread: () => number;
  setChatOpen: (isOpen: boolean) => void;
  setChatSearchQuery: (query: string) => void;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  selectedConversationId: null,
  draftMessages: {},
  typingUsers: {},
  unreadCounts: {},
  isChatOpen: false,
  chatSearchQuery: '',
};

// ============================================
// STORE FACTORY
// ============================================

/**
 * Creates the Chat UI store with optional custom storage.
 *
 * @param storage - Custom storage adapter (for React Native AsyncStorage)
 *
 * @example
 * // Web (uses localStorage by default)
 * const useChatUIStore = createChatUIStore();
 *
 * @example
 * // React Native
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage: StateStorage = {
 *   getItem: async (name) => await AsyncStorage.getItem(name) ?? null,
 *   setItem: async (name, value) => await AsyncStorage.setItem(name, value),
 *   removeItem: async (name) => await AsyncStorage.removeItem(name),
 * };
 * const useChatUIStore = createChatUIStore(storage);
 */
export function createChatUIStore(storage?: StateStorage) {
  return create<ChatUIState>()(
    persist(
      (set, get) => ({
        ...initialState,

        // Selection
        selectConversation: (id) => {
          set({ selectedConversationId: id });
          // Auto-mark as read when selecting
          if (id) {
            get().markAsRead(id);
          }
        },

        // Drafts
        setDraft: (conversationId, text, attachmentPaths) => {
          set((state) => ({
            draftMessages: {
              ...state.draftMessages,
              [conversationId]: {
                text,
                attachmentPaths,
                updatedAt: Date.now(),
              },
            },
          }));
        },

        clearDraft: (conversationId) => {
          set((state) => {
            const { [conversationId]: _, ...rest } = state.draftMessages;
            return { draftMessages: rest };
          });
        },

        getDraft: (conversationId) => {
          return get().draftMessages[conversationId];
        },

        // Typing indicators
        setTypingUsers: (conversationId, userIds) => {
          set((state) => ({
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: userIds,
            },
          }));
        },

        clearTypingUsers: (conversationId) => {
          set((state) => {
            const { [conversationId]: _, ...rest } = state.typingUsers;
            return { typingUsers: rest };
          });
        },

        // Unread counts
        setUnreadCount: (conversationId, count) => {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: Math.max(0, count),
            },
          }));
        },

        incrementUnread: (conversationId) => {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
            },
          }));
        },

        markAsRead: (conversationId) => {
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: 0,
            },
          }));
        },

        markAllAsRead: () => {
          set((state) => {
            const clearedCounts = Object.keys(state.unreadCounts).reduce(
              (acc, key) => ({ ...acc, [key]: 0 }),
              {} as Record<string, number>
            );
            return { unreadCounts: clearedCounts };
          });
        },

        getTotalUnread: () => {
          const counts = get().unreadCounts;
          return Object.values(counts).reduce((sum, count) => sum + count, 0);
        },

        // UI state
        setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
        setChatSearchQuery: (query) => set({ chatSearchQuery: query }),

        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'medsync-chat-ui',
        storage: storage ? createJSONStorage(() => storage) : undefined,
        // Only persist certain fields (not typing indicators which are transient)
        partialize: (state) => ({
          selectedConversationId: state.selectedConversationId,
          draftMessages: state.draftMessages,
          unreadCounts: state.unreadCounts,
        }),
      }
    )
  );
}

// ============================================
// DEFAULT STORE INSTANCE
// ============================================

/**
 * Default Chat UI store instance.
 * Uses localStorage on web, configure with createChatUIStore() for mobile.
 */
export const useChatUIStore = createChatUIStore();

// ============================================
// SELECTORS
// ============================================

/**
 * Selector for checking if a specific conversation has a draft
 */
export const selectHasDraft = (conversationId: string) => (state: ChatUIState) =>
  !!state.draftMessages[conversationId]?.text;

/**
 * Selector for checking if users are typing in a conversation
 */
export const selectIsTyping = (conversationId: string) => (state: ChatUIState) =>
  (state.typingUsers[conversationId]?.length ?? 0) > 0;

/**
 * Selector for unread count of a specific conversation
 */
export const selectUnreadCount = (conversationId: string) => (state: ChatUIState) =>
  state.unreadCounts[conversationId] ?? 0;
