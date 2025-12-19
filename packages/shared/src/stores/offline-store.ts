/**
 * Offline Store (Zustand)
 *
 * Manages offline state and queued mutations for when the app is offline.
 * This is especially important for mobile apps that may lose connectivity.
 *
 * Features:
 * - Queue mutations when offline
 * - Retry logic with exponential backoff
 * - Persistence to survive app restarts
 * - Network status tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type MutationType =
  | 'send_message'
  | 'delete_message'
  | 'upload_attachment'
  | 'update_attachment_status'
  | 'update_profile'
  | 'accept_shift'
  | 'decline_shift'
  | 'request_swap'
  | 'respond_to_swap'
  | 'check_in'
  | 'check_out';

export interface PendingMutation<T = unknown> {
  id: string;
  type: MutationType;
  payload: T;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
  error?: string;
  priority: number; // Lower = higher priority
}

export interface OfflineState {
  // Network status
  isOnline: boolean;
  lastOnlineAt: number | null;

  // Pending mutations queue
  pendingMutations: PendingMutation[];

  // Processing state
  isProcessingQueue: boolean;
  processingMutationId: string | null;

  // Actions
  setOnline: (isOnline: boolean) => void;
  addPendingMutation: <T>(
    mutation: Omit<PendingMutation<T>, 'id' | 'createdAt' | 'retryCount' | 'priority'> & {
      priority?: number;
    }
  ) => string;
  removePendingMutation: (id: string) => void;
  updateMutationError: (id: string, error: string) => void;
  incrementRetry: (id: string) => void;
  setProcessing: (isProcessing: boolean, mutationId?: string | null) => void;
  getNextMutation: () => PendingMutation | undefined;
  getPendingCount: () => number;
  getPendingByType: (type: MutationType) => PendingMutation[];
  clearAllPending: () => void;
  clearFailedMutations: (maxRetries?: number) => void;
  reset: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_RETRIES = 5;
const DEFAULT_PRIORITY = 10;

// Priority levels for different mutation types
const MUTATION_PRIORITIES: Record<MutationType, number> = {
  check_in: 1,
  check_out: 1,
  send_message: 2,
  accept_shift: 3,
  decline_shift: 3,
  respond_to_swap: 4,
  request_swap: 5,
  upload_attachment: 6,
  update_attachment_status: 7,
  delete_message: 8,
  update_profile: 9,
};

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  isOnline: true,
  lastOnlineAt: null,
  pendingMutations: [],
  isProcessingQueue: false,
  processingMutationId: null,
};

// ============================================
// STORE FACTORY
// ============================================

/**
 * Creates the Offline store with optional custom storage.
 *
 * @param storage - Custom storage adapter (for React Native AsyncStorage)
 */
export function createOfflineStore(storage?: StateStorage) {
  return create<OfflineState>()(
    persist(
      (set, get) => ({
        ...initialState,

        setOnline: (isOnline) => {
          set((state) => ({
            isOnline,
            lastOnlineAt: isOnline ? Date.now() : state.lastOnlineAt,
          }));
        },

        addPendingMutation: <T>(
          mutation: Omit<PendingMutation<T>, 'id' | 'createdAt' | 'retryCount' | 'priority'> & {
            priority?: number;
          }
        ) => {
          const id = generateId();
          const priority = mutation.priority ?? MUTATION_PRIORITIES[mutation.type] ?? DEFAULT_PRIORITY;

          set((state) => ({
            pendingMutations: [
              ...state.pendingMutations,
              {
                ...mutation,
                id,
                createdAt: Date.now(),
                retryCount: 0,
                priority,
              } as PendingMutation,
            ].sort((a, b) => a.priority - b.priority), // Keep sorted by priority
          }));

          return id;
        },

        removePendingMutation: (id) => {
          set((state) => ({
            pendingMutations: state.pendingMutations.filter((m) => m.id !== id),
          }));
        },

        updateMutationError: (id, error) => {
          set((state) => ({
            pendingMutations: state.pendingMutations.map((m) =>
              m.id === id ? { ...m, error, lastAttemptAt: Date.now() } : m
            ),
          }));
        },

        incrementRetry: (id) => {
          set((state) => ({
            pendingMutations: state.pendingMutations.map((m) =>
              m.id === id
                ? { ...m, retryCount: m.retryCount + 1, lastAttemptAt: Date.now() }
                : m
            ),
          }));
        },

        setProcessing: (isProcessing, mutationId = null) => {
          set({
            isProcessingQueue: isProcessing,
            processingMutationId: mutationId,
          });
        },

        getNextMutation: () => {
          const { pendingMutations } = get();
          // Get first mutation that hasn't exceeded max retries
          return pendingMutations.find((m) => m.retryCount < MAX_RETRIES);
        },

        getPendingCount: () => {
          return get().pendingMutations.length;
        },

        getPendingByType: (type) => {
          return get().pendingMutations.filter((m) => m.type === type);
        },

        clearAllPending: () => {
          set({ pendingMutations: [] });
        },

        clearFailedMutations: (maxRetries = MAX_RETRIES) => {
          set((state) => ({
            pendingMutations: state.pendingMutations.filter(
              (m) => m.retryCount < maxRetries
            ),
          }));
        },

        reset: () => set(initialState),
      }),
      {
        name: 'medsync-offline',
        storage: storage ? createJSONStorage(() => storage) : undefined,
        // Persist everything except processing state
        partialize: (state) => ({
          isOnline: state.isOnline,
          lastOnlineAt: state.lastOnlineAt,
          pendingMutations: state.pendingMutations,
        }),
      }
    )
  );
}

// ============================================
// DEFAULT STORE INSTANCE
// ============================================

/**
 * Default Offline store instance.
 */
export const useOfflineStore = createOfflineStore();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique ID for mutations
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate delay for retry with exponential backoff
 * @param retryCount - Current retry count
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  return Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
}

/**
 * Check if a mutation should be retried
 */
export function shouldRetry(mutation: PendingMutation): boolean {
  return mutation.retryCount < MAX_RETRIES;
}

// ============================================
// SELECTORS
// ============================================

/**
 * Selector for checking if there are pending mutations
 */
export const selectHasPendingMutations = (state: OfflineState) =>
  state.pendingMutations.length > 0;

/**
 * Selector for pending mutations of a specific type
 */
export const selectPendingByType = (type: MutationType) => (state: OfflineState) =>
  state.pendingMutations.filter((m) => m.type === type);

/**
 * Selector for failed mutations (exceeded max retries)
 */
export const selectFailedMutations = (state: OfflineState) =>
  state.pendingMutations.filter((m) => m.retryCount >= MAX_RETRIES);
