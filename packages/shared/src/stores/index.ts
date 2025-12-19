// Chat UI Store
export {
  useChatUIStore,
  createChatUIStore,
  selectHasDraft,
  selectIsTyping,
  selectUnreadCount,
} from './chat-ui-store';
export type { ChatUIState, DraftMessage } from './chat-ui-store';

// Offline Store
export {
  useOfflineStore,
  createOfflineStore,
  calculateRetryDelay,
  shouldRetry,
  selectHasPendingMutations,
  selectPendingByType,
  selectFailedMutations,
} from './offline-store';
export type { OfflineState, PendingMutation, MutationType } from './offline-store';

// Preferences Store
export {
  usePreferencesStore,
  createPreferencesStore,
  selectCalendarView,
  selectTheme,
  selectSidebarState,
  selectIsSidebarExpanded,
  selectLastFilters,
  selectNotificationPreferences,
} from './preferences-store';
export type {
  PreferencesState,
  CalendarPreferences,
  FilterPreferences,
  NotificationPreferences,
  CalendarView,
  ThemeMode,
  SidebarState,
} from './preferences-store';
