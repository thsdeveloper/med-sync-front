/**
 * SMTP Settings API Routes
 *
 * Manages SMTP configuration for organizations.
 * Supports GET (fetch), POST (create), and PATCH (update) operations.
 *
 * Features:
 * - Admin-only authorization (Administrador or Dono roles)
 * - Password encryption before storage using AES-256-GCM
 * - Server-side validation with Zod schemas
 * - Password sanitization (never returned in responses)
 * - Row Level Security (RLS) enforced by Supabase
 *
 * @route /api/smtp-settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { smtpSettingsSchema, smtpSettingsUpdateSchema } from '@/schemas/smtp-settings.schema';
import { encryptPassword } from '@/lib/encryption/smtp-encryption';
import {
  checkAdminAccess,
  getOrganizationIdFromBody,
  getOrganizationIdFromQuery,
} from '@/lib/auth/admin-check';

/**
 * Removes password field from SMTP settings response
 *
 * @param settings - SMTP settings object from database
 * @returns Sanitized settings without password
 */
function sanitizeSmtpSettings<T extends Record<string, unknown>>(settings: T): Omit<T, 'smtp_password'> {
  const { smtp_password, ...sanitized } = settings;
  return sanitized;
}

/**
 * GET /api/smtp-settings
 *
 * Fetches current SMTP settings for an organization.
 * Requires admin access to the organization.
 *
 * Query Parameters:
 * - organization_id (required): UUID of the organization
 *
 * Returns:
 * {
 *   ok: true,
 *   data: {
 *     id: string,
 *     organization_id: string,
 *     smtp_host: string,
 *     smtp_port: number,
 *     smtp_user: string,
 *     smtp_from_email: string,
 *     smtp_from_name: string,
 *     use_tls: boolean,
 *     is_enabled: boolean,
 *     created_at: string,
 *     updated_at: string
 *     // Note: smtp_password is NOT included in response
 *   }
 * }
 *
 * Error Responses:
 * - 400: Missing organization_id parameter
 * - 401: User not authenticated
 * - 403: User not authorized (not admin)
 * - 404: No SMTP settings found for organization
 * - 500: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get organization_id from query parameters
    const searchParams = request.nextUrl.searchParams;
    const organizationId = getOrganizationIdFromQuery(searchParams);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id parameter is required' },
        { status: 400 }
      );
    }

    // Check admin access
    const adminCheck = await checkAdminAccess(user.id, organizationId);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error || 'Acesso negado' }, { status: 403 });
    }

    // Fetch SMTP settings from database
    const { data: smtpSettings, error: fetchError } = await supabase
      .from('email_smtp_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching SMTP settings:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações SMTP' },
        { status: 500 }
      );
    }

    // No settings found for organization
    if (!smtpSettings) {
      return NextResponse.json(
        { error: 'Nenhuma configuração SMTP encontrada para esta organização' },
        { status: 404 }
      );
    }

    // Sanitize response (remove password)
    const sanitizedSettings = sanitizeSmtpSettings(smtpSettings);

    return NextResponse.json({
      ok: true,
      data: sanitizedSettings,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/smtp-settings:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/smtp-settings
 *
 * Creates new SMTP settings for an organization.
 * Requires admin access. Organization can only have one SMTP configuration.
 *
 * Request Body (JSON):
 * {
 *   organization_id: string,
 *   smtp_host: string,
 *   smtp_port: number,
 *   smtp_user: string,
 *   smtp_password: string,
 *   smtp_from_email: string,
 *   smtp_from_name?: string,
 *   use_tls?: boolean,
 *   is_enabled?: boolean
 * }
 *
 * Returns:
 * {
 *   ok: true,
 *   data: { ...sanitized settings without password... }
 * }
 *
 * Error Responses:
 * - 400: Missing organization_id or validation errors
 * - 401: User not authenticated
 * - 403: User not authorized (not admin)
 * - 409: Organization already has SMTP settings
 * - 500: Server error or encryption failure
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Get organization_id from body
    const organizationId = getOrganizationIdFromBody(body);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id é obrigatório no corpo da requisição' },
        { status: 400 }
      );
    }

    // Check admin access
    const adminCheck = await checkAdminAccess(user.id, organizationId);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error || 'Acesso negado' }, { status: 403 });
    }

    // Validate request body with Zod schema
    const validation = smtpSettingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados de entrada inválidos',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Encrypt password before storage
    let encryptedPassword: string;
    try {
      encryptedPassword = encryptPassword(validatedData.smtp_password);
    } catch (encryptError) {
      console.error('Error encrypting password:', encryptError);
      return NextResponse.json(
        { error: 'Erro ao processar senha SMTP' },
        { status: 500 }
      );
    }

    // Insert into database
    const { data: newSettings, error: insertError } = await supabase
      .from('email_smtp_settings')
      .insert({
        organization_id: organizationId,
        smtp_host: validatedData.smtp_host,
        smtp_port: validatedData.smtp_port,
        smtp_user: validatedData.smtp_user,
        smtp_password: encryptedPassword,
        smtp_from_email: validatedData.smtp_from_email,
        smtp_from_name: validatedData.smtp_from_name,
        use_tls: validatedData.use_tls,
        is_enabled: validatedData.is_enabled,
      })
      .select()
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Esta organização já possui configurações SMTP. Use PATCH para atualizar.' },
          { status: 409 }
        );
      }

      console.error('Error creating SMTP settings:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar configurações SMTP' },
        { status: 500 }
      );
    }

    // Sanitize response (remove password)
    const sanitizedSettings = sanitizeSmtpSettings(newSettings);

    return NextResponse.json(
      {
        ok: true,
        data: sanitizedSettings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/smtp-settings:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/smtp-settings
 *
 * Updates existing SMTP settings for an organization.
 * Requires admin access. All fields are optional (partial update).
 *
 * Request Body (JSON):
 * {
 *   organization_id: string,  // Required to identify which settings to update
 *   smtp_host?: string,
 *   smtp_port?: number,
 *   smtp_user?: string,
 *   smtp_password?: string,  // If provided, will be encrypted
 *   smtp_from_email?: string,
 *   smtp_from_name?: string,
 *   use_tls?: boolean,
 *   is_enabled?: boolean
 * }
 *
 * Returns:
 * {
 *   ok: true,
 *   data: { ...sanitized updated settings without password... }
 * }
 *
 * Error Responses:
 * - 400: Missing organization_id or validation errors
 * - 401: User not authenticated
 * - 403: User not authorized (not admin)
 * - 404: No SMTP settings found for organization
 * - 500: Server error or encryption failure
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Get organization_id from body
    const organizationId = getOrganizationIdFromBody(body);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id é obrigatório no corpo da requisição' },
        { status: 400 }
      );
    }

    // Check admin access
    const adminCheck = await checkAdminAccess(user.id, organizationId);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: adminCheck.error || 'Acesso negado' }, { status: 403 });
    }

    // Extract only SMTP fields (exclude organization_id from validation)
    const { organization_id: _, ...smtpFields } = body as Record<string, unknown>;

    // Check if there's anything to update before validation
    if (Object.keys(smtpFields).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar foi fornecido' },
        { status: 400 }
      );
    }

    // Validate request body with partial Zod schema
    const validation = smtpSettingsUpdateSchema.safeParse(smtpFields);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados de entrada inválidos',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Prepare update object
    const updateData: Record<string, unknown> = {};

    // Copy all validated fields to update object
    if (validatedData.smtp_host !== undefined) updateData.smtp_host = validatedData.smtp_host;
    if (validatedData.smtp_port !== undefined) updateData.smtp_port = validatedData.smtp_port;
    if (validatedData.smtp_user !== undefined) updateData.smtp_user = validatedData.smtp_user;
    if (validatedData.smtp_from_email !== undefined)
      updateData.smtp_from_email = validatedData.smtp_from_email;
    if (validatedData.smtp_from_name !== undefined)
      updateData.smtp_from_name = validatedData.smtp_from_name;
    if (validatedData.use_tls !== undefined) updateData.use_tls = validatedData.use_tls;
    if (validatedData.is_enabled !== undefined) updateData.is_enabled = validatedData.is_enabled;

    // Encrypt password if provided
    if (validatedData.smtp_password !== undefined) {
      try {
        updateData.smtp_password = encryptPassword(validatedData.smtp_password);
      } catch (encryptError) {
        console.error('Error encrypting password:', encryptError);
        return NextResponse.json(
          { error: 'Erro ao processar senha SMTP' },
          { status: 500 }
        );
      }
    }

    // Update database
    const { data: updatedSettings, error: updateError } = await supabase
      .from('email_smtp_settings')
      .update(updateData)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      // Check for not found error
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Nenhuma configuração SMTP encontrada para esta organização' },
          { status: 404 }
        );
      }

      console.error('Error updating SMTP settings:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar configurações SMTP' },
        { status: 500 }
      );
    }

    // Sanitize response (remove password)
    const sanitizedSettings = sanitizeSmtpSettings(updatedSettings);

    return NextResponse.json({
      ok: true,
      data: sanitizedSettings,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/smtp-settings:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
