/**
 * Preferences Store (Zustand)
 *
 * Manages user preferences that should persist across sessions.
 * Works with both web (localStorage) and mobile (AsyncStorage).
 *
 * Features:
 * - Calendar view preferences
 * - UI preferences (sidebar, theme)
 * - Last selected filters
 * - Session persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type CalendarView = 'day' | 'week' | 'month';
export type ThemeMode = 'light' | 'dark' | 'system';
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

export interface CalendarPreferences {
  view: CalendarView;
  showWeekends: boolean;
  startWeekOnMonday: boolean;
  defaultStartHour: number;
  defaultEndHour: number;
}

export interface FilterPreferences {
  lastFacilityId: string | null;
  lastSectorId: string | null;
  lastSpecialtyId: string | null;
  lastStatusFilter: string[];
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  shiftReminders: boolean;
  swapRequests: boolean;
  chatMessages: boolean;
  documentReviews: boolean;
}

export interface PreferencesState {
  // Calendar
  calendar: CalendarPreferences;

  // UI
  theme: ThemeMode;
  sidebarState: SidebarState;
  compactMode: boolean;

  // Filters (last used)
  filters: FilterPreferences;

  // Session
  lastOrganizationId: string | null;
  lastVisitedRoute: string | null;

  // Notifications
  notifications: NotificationPreferences;

  // Actions - Calendar
  setCalendarView: (view: CalendarView) => void;
  setShowWeekends: (show: boolean) => void;
  setStartWeekOnMonday: (start: boolean) => void;
  setDefaultHours: (start: number, end: number) => void;

  // Actions - UI
  setTheme: (theme: ThemeMode) => void;
  setSidebarState: (state: SidebarState) => void;
  toggleSidebar: () => void;
  setCompactMode: (compact: boolean) => void;

  // Actions - Filters
  setLastFacility: (id: string | null) => void;
  setLastSector: (id: string | null) => void;
  setLastSpecialty: (id: string | null) => void;
  setLastStatusFilter: (statuses: string[]) => void;
  clearFilters: () => void;

  // Actions - Session
  setLastOrganization: (id: string | null) => void;
  setLastVisitedRoute: (route: string | null) => void;

  // Actions - Notifications
  setNotificationPreference: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => void;

  // Actions - Reset
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialCalendar: CalendarPreferences = {
  view: 'week',
  showWeekends: true,
  startWeekOnMonday: true,
  defaultStartHour: 6,
  defaultEndHour: 22,
};

const initialFilters: FilterPreferences = {
  lastFacilityId: null,
  lastSectorId: null,
  lastSpecialtyId: null,
  lastStatusFilter: [],
};

const initialNotifications: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  shiftReminders: true,
  swapRequests: true,
  chatMessages: true,
  documentReviews: true,
};

const initialState = {
  calendar: initialCalendar,
  theme: 'system' as ThemeMode,
  sidebarState: 'expanded' as SidebarState,
  compactMode: false,
  filters: initialFilters,
  lastOrganizationId: null,
  lastVisitedRoute: null,
  notifications: initialNotifications,
};

// ============================================
// STORE FACTORY
// ============================================

/**
 * Creates the Preferences store with optional custom storage.
 *
 * @param storage - Custom storage adapter (for React Native AsyncStorage)
 */
export function createPreferencesStore(storage?: StateStorage) {
  return create<PreferencesState>()(
    persist(
      (set, get) => ({
        ...initialState,

        // Calendar actions
        setCalendarView: (view) =>
          set((state) => ({ calendar: { ...state.calendar, view } })),

        setShowWeekends: (show) =>
          set((state) => ({ calendar: { ...state.calendar, showWeekends: show } })),

        setStartWeekOnMonday: (start) =>
          set((state) => ({ calendar: { ...state.calendar, startWeekOnMonday: start } })),

        setDefaultHours: (start, end) =>
          set((state) => ({
            calendar: { ...state.calendar, defaultStartHour: start, defaultEndHour: end },
          })),

        // UI actions
        setTheme: (theme) => set({ theme }),

        setSidebarState: (sidebarState) => set({ sidebarState }),

        toggleSidebar: () =>
          set((state) => ({
            sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded',
          })),

        setCompactMode: (compact) => set({ compactMode: compact }),

        // Filter actions
        setLastFacility: (id) =>
          set((state) => ({ filters: { ...state.filters, lastFacilityId: id } })),

        setLastSector: (id) =>
          set((state) => ({ filters: { ...state.filters, lastSectorId: id } })),

        setLastSpecialty: (id) =>
          set((state) => ({ filters: { ...state.filters, lastSpecialtyId: id } })),

        setLastStatusFilter: (statuses) =>
          set((state) => ({ filters: { ...state.filters, lastStatusFilter: statuses } })),

        clearFilters: () => set({ filters: initialFilters }),

        // Session actions
        setLastOrganization: (id) => set({ lastOrganizationId: id }),
        setLastVisitedRoute: (route) => set({ lastVisitedRoute: route }),

        // Notification actions
        setNotificationPreference: (key, value) =>
          set((state) => ({
            notifications: { ...state.notifications, [key]: value },
          })),

        // Reset
        reset: () => set(initialState),
      }),
      {
        name: 'medsync-preferences',
        storage: storage ? createJSONStorage(() => storage) : undefined,
        // Version for migrations
        version: 1,
        migrate: (persistedState, version) => {
          // Handle migrations between versions if needed
          return persistedState as PreferencesState;
        },
      }
    )
  );
}

// ============================================
// DEFAULT STORE INSTANCE
// ============================================

/**
 * Default Preferences store instance.
 */
export const usePreferencesStore = createPreferencesStore();

// ============================================
// SELECTORS
// ============================================

/**
 * Selector for calendar view
 */
export const selectCalendarView = (state: PreferencesState) => state.calendar.view;

/**
 * Selector for theme
 */
export const selectTheme = (state: PreferencesState) => state.theme;

/**
 * Selector for sidebar state
 */
export const selectSidebarState = (state: PreferencesState) => state.sidebarState;

/**
 * Selector for checking if sidebar is expanded
 */
export const selectIsSidebarExpanded = (state: PreferencesState) =>
  state.sidebarState === 'expanded';

/**
 * Selector for last used filters
 */
export const selectLastFilters = (state: PreferencesState) => state.filters;

/**
 * Selector for notification preferences
 */
export const selectNotificationPreferences = (state: PreferencesState) =>
  state.notifications;
