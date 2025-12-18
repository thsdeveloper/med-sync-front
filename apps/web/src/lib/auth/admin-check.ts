/**
 * Admin Authorization Utilities
 *
 * Provides utilities for checking if a user has admin/owner permissions
 * for a specific organization.
 *
 * @module lib/auth/admin-check
 */

import { supabase } from '@/lib/supabase';

/**
 * Valid admin roles that can perform administrative actions
 */
const ADMIN_ROLES = ['Administrador', 'Dono'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Result from admin check operation
 */
export interface AdminCheckResult {
  /**
   * Whether the user has admin access
   */
  isAdmin: boolean;
  /**
   * The user's role (if they have access to the organization)
   */
  role?: string;
  /**
   * The medical staff record ID (if user is part of organization)
   */
  staffId?: string;
  /**
   * Error message if check failed
   */
  error?: string;
}

/**
 * Checks if a user has admin access to an organization
 *
 * This function verifies that:
 * 1. The user is authenticated
 * 2. The user is a member of the specified organization
 * 3. The user has an admin role (Administrador or Dono)
 *
 * @param userId - The authenticated user's ID
 * @param organizationId - The organization ID to check access for
 * @returns AdminCheckResult with isAdmin flag and additional details
 *
 * @example
 * ```typescript
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
 * }
 *
 * const adminCheck = await checkAdminAccess(user.id, organizationId);
 * if (!adminCheck.isAdmin) {
 *   return NextResponse.json(
 *     { error: 'Acesso negado. Apenas administradores podem realizar esta ação.' },
 *     { status: 403 }
 *   );
 * }
 * ```
 */
export async function checkAdminAccess(
  userId: string,
  organizationId: string
): Promise<AdminCheckResult> {
  try {
    // Query medical_staff table to get user's role in the organization
    const { data: staffMember, error: staffError } = await supabase
      .from('medical_staff')
      .select('id, funcao, organization_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (staffError) {
      console.error('Error checking admin access:', staffError);
      return {
        isAdmin: false,
        error: 'Erro ao verificar permissões',
      };
    }

    // User not found in organization
    if (!staffMember) {
      return {
        isAdmin: false,
        error: 'Você não pertence a esta organização',
      };
    }

    // Check if user has admin role
    const isAdmin = ADMIN_ROLES.includes(staffMember.funcao as AdminRole);

    return {
      isAdmin,
      role: staffMember.funcao,
      staffId: staffMember.id,
      error: isAdmin ? undefined : 'Acesso negado. Apenas administradores podem realizar esta ação.',
    };
  } catch (error) {
    console.error('Unexpected error in checkAdminAccess:', error);
    return {
      isAdmin: false,
      error: 'Erro interno ao verificar permissões',
    };
  }
}

/**
 * Extracts organization ID from request body
 *
 * Helper function to get organization_id from request payload.
 * Used in POST/PATCH requests where organization_id is in the body.
 *
 * @param body - The request body (already parsed JSON)
 * @returns Organization ID or null if not found
 *
 * @example
 * ```typescript
 * const body = await request.json();
 * const organizationId = getOrganizationIdFromBody(body);
 * if (!organizationId) {
 *   return NextResponse.json(
 *     { error: 'organization_id é obrigatório' },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function getOrganizationIdFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const orgId = (body as Record<string, unknown>).organization_id;

  if (typeof orgId === 'string' && orgId.length > 0) {
    return orgId;
  }

  return null;
}

/**
 * Extracts organization ID from URL query parameters
 *
 * Helper function to get organization_id from request query string.
 * Used in GET requests where organization_id is a URL parameter.
 *
 * @param searchParams - The URL search parameters
 * @returns Organization ID or null if not found
 *
 * @example
 * ```typescript
 * const searchParams = request.nextUrl.searchParams;
 * const organizationId = getOrganizationIdFromQuery(searchParams);
 * if (!organizationId) {
 *   return NextResponse.json(
 *     { error: 'organization_id parameter is required' },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function getOrganizationIdFromQuery(searchParams: URLSearchParams): string | null {
  return searchParams.get('organization_id');
}
