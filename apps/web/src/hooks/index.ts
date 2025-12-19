/**
 * Custom React Hooks
 *
 * This module exports all custom hooks used in the MedSync web application.
 * Import hooks from this file for consistent module resolution.
 *
 * @module hooks
 */

export { useDataTable, type UseDataTableOptions, type UseDataTableResult } from './useDataTable';
export { useSmtpSettings, type UseSmtpSettingsResult, type SmtpSettings } from './useSmtpSettings';
export { useMedicalStaffDetail, type UseMedicalStaffDetailResult } from './useMedicalStaffDetail';
export { useMediaQuery, useChatBreakpoints, BREAKPOINTS } from './useMediaQuery';
export { useReadReceipts } from './useReadReceipts';
export { useTypingIndicator } from './useTypingIndicator';
export { useMessageSearch } from './useMessageSearch';
export { useChatMessages, type EnrichedMessage, type UseChatMessagesResult } from './useChatMessages';
export {
  useProfileImageUpload,
  type UseProfileImageUploadOptions,
  type UseProfileImageUploadResult,
  type ProfileImageUploadResult,
  ProfileImageError,
  ProfileImageErrorCode,
} from './useProfileImageUpload';
