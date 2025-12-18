/**
 * useSmtpSettings Hook
 *
 * Custom React hook for managing SMTP settings data using React Query.
 * Provides methods for fetching, saving, and testing SMTP configurations.
 *
 * Features:
 * - React Query integration for caching and automatic refetching
 * - Toast notifications for success/error feedback
 * - Organization context handling
 * - Loading state management
 * - Cache invalidation after mutations
 *
 * @module hooks/useSmtpSettings
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SmtpSettingsFormData } from '@/schemas/smtp-settings.schema';

/**
 * SMTP Settings data structure (without password for security)
 */
export interface SmtpSettings {
  id: string;
  organization_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from_email: string;
  smtp_from_name: string;
  use_tls: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * API response structure for SMTP settings
 */
interface SmtpSettingsResponse {
  ok: boolean;
  data?: SmtpSettings;
  error?: string;
}

/**
 * API response structure for test connection
 */
interface TestConnectionResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Hook options for configuration
 */
interface UseSmtpSettingsOptions {
  /**
   * Whether to automatically fetch settings on mount
   * @default true
   */
  enabled?: boolean;

  /**
   * Stale time in milliseconds (how long data is considered fresh)
   * @default 5 minutes (300000 ms)
   */
  staleTime?: number;

  /**
   * Whether to refetch on window focus
   * @default true
   */
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook return type with all methods and states
 */
export interface UseSmtpSettingsResult {
  /** Current SMTP settings data (null if not found) */
  settings: SmtpSettings | null;

  /** Whether data is loading for the first time */
  isLoading: boolean;

  /** Whether data is being fetched (including background refetch) */
  isFetching: boolean;

  /** Error object if fetch failed */
  error: Error | null;

  /** Whether save operation is in progress */
  isSaving: boolean;

  /** Whether test connection operation is in progress */
  isTesting: boolean;

  /**
   * Fetches SMTP settings from the server
   * Usually called automatically, but can be triggered manually
   */
  fetchSettings: () => Promise<void>;

  /**
   * Saves SMTP settings (creates or updates)
   * @param data - SMTP configuration data including password
   */
  saveSettings: (data: SmtpSettingsFormData & { organization_id: string }) => Promise<void>;

  /**
   * Tests SMTP connection by sending a test email
   * @param data - SMTP configuration data to test
   */
  testConnection: (data: SmtpSettingsFormData) => Promise<void>;

  /**
   * Manually refetch settings from the server
   */
  refetch: () => Promise<void>;
}

/**
 * Fetches SMTP settings for an organization
 */
async function fetchSmtpSettings(organizationId: string): Promise<SmtpSettings | null> {
  const params = new URLSearchParams({ organization_id: organizationId });
  const response = await fetch(`/api/smtp-settings?${params.toString()}`);

  if (!response.ok) {
    // Handle 404 as "no settings found" (not an error)
    if (response.status === 404) {
      return null;
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch SMTP settings: ${response.statusText}`);
  }

  const data: SmtpSettingsResponse = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch SMTP settings');
  }

  return data.data || null;
}

/**
 * Saves SMTP settings (create or update)
 */
async function saveSmtpSettings(
  data: SmtpSettingsFormData & { organization_id: string }
): Promise<SmtpSettings> {
  const response = await fetch('/api/smtp-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to save SMTP settings: ${response.statusText}`);
  }

  const result: SmtpSettingsResponse = await response.json();

  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to save SMTP settings');
  }

  return result.data;
}

/**
 * Tests SMTP connection
 */
async function testSmtpConnection(data: SmtpSettingsFormData): Promise<TestConnectionResponse> {
  const response = await fetch('/api/smtp-settings/test-connection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result: TestConnectionResponse = await response.json();

  // Return the result directly (success or failure)
  return result;
}

/**
 * Custom React hook to manage SMTP settings
 *
 * @param organizationId - UUID of the organization (required)
 * @param options - Optional configuration for the hook
 * @returns Hook result with settings data, loading states, and methods
 *
 * @example
 * Basic usage
 * ```tsx
 * function SmtpSettingsPage() {
 *   const { organizationId } = useOrganization();
 *   const {
 *     settings,
 *     isLoading,
 *     saveSettings,
 *     testConnection,
 *     isSaving,
 *     isTesting
 *   } = useSmtpSettings(organizationId);
 *
 *   const handleSubmit = async (data: SmtpSettingsFormData) => {
 *     await saveSettings({ ...data, organization_id: organizationId });
 *   };
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <SmtpSettingsForm
 *       defaultValues={settings || undefined}
 *       onSubmit={handleSubmit}
 *       onTestConnection={testConnection}
 *       isLoading={isSaving}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * With custom options
 * ```tsx
 * const { settings, saveSettings } = useSmtpSettings(organizationId, {
 *   enabled: !!organizationId,
 *   staleTime: 10 * 60 * 1000, // 10 minutes
 *   refetchOnWindowFocus: false,
 * });
 * ```
 */
export function useSmtpSettings(
  organizationId: string | null,
  options?: UseSmtpSettingsOptions
): UseSmtpSettingsResult {
  const queryClient = useQueryClient();

  // Build query key for React Query caching
  const queryKey = ['smtp-settings', organizationId];

  // Fetch SMTP settings using React Query
  const {
    data: settings = null,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchSmtpSettings(organizationId!),
    enabled: options?.enabled ?? !!organizationId,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (no settings found)
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: saveSmtpSettings,
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey });

      // Show success toast
      toast.success('Configurações SMTP salvas com sucesso!', {
        description: 'As configurações de e-mail foram atualizadas.',
      });
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error('Erro ao salvar configurações SMTP', {
        description: error.message || 'Ocorreu um erro ao salvar as configurações.',
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: (result) => {
      if (result.success) {
        // Show success toast
        toast.success('Conexão SMTP testada com sucesso!', {
          description: result.message || 'Email de teste enviado com sucesso.',
        });
      } else {
        // Show error toast
        toast.error('Falha no teste de conexão SMTP', {
          description: result.error || result.message || 'Não foi possível conectar ao servidor SMTP.',
        });
      }
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error('Erro ao testar conexão SMTP', {
        description: error.message || 'Ocorreu um erro ao testar a conexão.',
      });
    },
  });

  return {
    settings,
    isLoading,
    isFetching,
    error: error as Error | null,
    isSaving: saveSettingsMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    fetchSettings: async () => {
      await refetch();
    },
    saveSettings: async (data) => {
      await saveSettingsMutation.mutateAsync(data);
    },
    testConnection: async (data) => {
      await testConnectionMutation.mutateAsync(data);
    },
    refetch: async () => {
      await refetch();
    },
  };
}
