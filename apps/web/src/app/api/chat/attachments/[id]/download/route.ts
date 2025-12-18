/**
 * API Route: Download Chat Attachment
 *
 * GET /api/chat/attachments/[id]/download
 *
 * Generates a signed URL for downloading a chat attachment from Supabase Storage.
 * Validates user permissions before generating the URL.
 *
 * Features:
 * - Permission validation (admins can download all, staff can download accepted)
 * - Signed URL generation with 1-hour expiry
 * - Security checks for organization membership
 * - Supports both images and PDFs
 *
 * @route GET /api/chat/attachments/:id/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attachmentId } = await params;

    // Get authenticated user
    // Note: For production, you should implement proper authentication
    // For now, we'll fetch the attachment and verify permissions via RLS
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Fetch attachment with conversation details
    const { data: attachment, error: fetchError } = await supabase
      .from('chat_attachments')
      .select(
        `
        *,
        conversation:chat_conversations!inner (
          id,
          organization_id,
          conversation_type
        )
      `
      )
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 });
    }

    // Check if user is a staff member in the organization
    const { data: staffMember } = await supabase
      .from('medical_staff')
      .select('id, funcao, organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', attachment.conversation.organization_id)
      .maybeSingle();

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este anexo' },
        { status: 403 }
      );
    }

    // Permission check:
    // - Admins can download all attachments
    // - Staff can only download accepted attachments or their own uploads
    const isAdmin = staffMember.funcao === 'Administrador';
    const isOwnUpload = attachment.sender_id === staffMember.id;
    const isAccepted = attachment.status === 'accepted';

    if (!isAdmin && !isOwnUpload && !isAccepted) {
      return NextResponse.json(
        { error: 'Este documento ainda não foi aprovado' },
        { status: 403 }
      );
    }

    // Generate signed URL (1 hour expiry)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('chat-documents')
      .createSignedUrl(attachment.file_path, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      console.error('Error generating signed URL:', urlError);
      return NextResponse.json(
        { error: 'Erro ao gerar URL de download' },
        { status: 500 }
      );
    }

    // Return signed URL
    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileSize: attachment.file_size,
    });
  } catch (error) {
    console.error('Error in attachment download route:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
