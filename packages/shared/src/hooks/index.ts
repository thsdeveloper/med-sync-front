/**
 * Shared React hooks for MedSync applications
 *
 * These hooks are designed to work across both web and mobile platforms.
 * They accept Supabase client as a parameter to maintain platform independence.
 */

// Reference data hooks (existing)
export * from './useEspecialidades';
export * from './useProfissoes';
export * from './useConselhos';
export * from './useAttachmentRealtime';

// Query hooks (new)
export * from './queries';

// Mutation hooks (new)
export * from './mutations';
