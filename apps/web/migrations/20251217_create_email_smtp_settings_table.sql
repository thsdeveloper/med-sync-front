-- Migration: Create email_smtp_settings table for organization SMTP configuration
-- Description: Stores SMTP server settings for organizations to send emails
-- Author: MedSync Development Team
-- Date: 2025-12-17

-- Drop table if exists (for idempotency during development)
DROP TABLE IF EXISTS public.email_smtp_settings CASCADE;

-- Create email_smtp_settings table
CREATE TABLE public.email_smtp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL CHECK (smtp_port > 0 AND smtp_port <= 65535),
    smtp_user TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    smtp_from_email TEXT NOT NULL,
    smtp_from_name TEXT NOT NULL,
    use_tls BOOLEAN NOT NULL DEFAULT true,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT email_smtp_settings_organization_id_key UNIQUE (organization_id),
    CONSTRAINT smtp_port_range CHECK (smtp_port > 0 AND smtp_port <= 65535),
    CONSTRAINT valid_email_format CHECK (smtp_from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add table comment
COMMENT ON TABLE public.email_smtp_settings IS 'SMTP configuration settings for organizations to send emails. One configuration per organization with admin-only access via RLS policies.';

-- Add column comments
COMMENT ON COLUMN public.email_smtp_settings.id IS 'Primary key UUID';
COMMENT ON COLUMN public.email_smtp_settings.organization_id IS 'Foreign key to organizations table. One SMTP config per organization.';
COMMENT ON COLUMN public.email_smtp_settings.smtp_host IS 'SMTP server hostname or IP address (e.g., smtp.gmail.com)';
COMMENT ON COLUMN public.email_smtp_settings.smtp_port IS 'SMTP server port (typically 25, 465, 587, or 2525)';
COMMENT ON COLUMN public.email_smtp_settings.smtp_user IS 'Username for SMTP authentication';
COMMENT ON COLUMN public.email_smtp_settings.smtp_password IS 'Password for SMTP authentication. Encrypted at rest by Supabase.';
COMMENT ON COLUMN public.email_smtp_settings.smtp_from_email IS 'Email address used as sender (FROM field)';
COMMENT ON COLUMN public.email_smtp_settings.smtp_from_name IS 'Display name for sender (e.g., "MedSync Notifications")';
COMMENT ON COLUMN public.email_smtp_settings.use_tls IS 'Enable TLS/SSL encryption for SMTP connection';
COMMENT ON COLUMN public.email_smtp_settings.is_enabled IS 'Enable/disable SMTP configuration without deleting it';
COMMENT ON COLUMN public.email_smtp_settings.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.email_smtp_settings.updated_at IS 'Timestamp when record was last updated';

-- Create index on organization_id for faster lookups (already unique, but explicit index)
CREATE INDEX idx_email_smtp_settings_organization_id ON public.email_smtp_settings(organization_id);

-- Create index on is_enabled for filtering active configurations
CREATE INDEX idx_email_smtp_settings_is_enabled ON public.email_smtp_settings(is_enabled) WHERE is_enabled = true;

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_smtp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admin users can SELECT their organization's SMTP settings
CREATE POLICY "Admins can view SMTP settings"
    ON public.email_smtp_settings
    FOR SELECT
    USING (user_has_org_admin_access(organization_id));

-- RLS Policy: Admin users can INSERT SMTP settings for their organization
CREATE POLICY "Admins can insert SMTP settings"
    ON public.email_smtp_settings
    FOR INSERT
    WITH CHECK (user_has_org_admin_access(organization_id));

-- RLS Policy: Admin users can UPDATE their organization's SMTP settings
CREATE POLICY "Admins can update SMTP settings"
    ON public.email_smtp_settings
    FOR UPDATE
    USING (user_has_org_admin_access(organization_id))
    WITH CHECK (user_has_org_admin_access(organization_id));

-- RLS Policy: Admin users can DELETE their organization's SMTP settings
CREATE POLICY "Admins can delete SMTP settings"
    ON public.email_smtp_settings
    FOR DELETE
    USING (user_has_org_admin_access(organization_id));

-- Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_email_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before UPDATE
CREATE TRIGGER trigger_update_email_smtp_settings_updated_at
    BEFORE UPDATE ON public.email_smtp_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_smtp_settings_updated_at();

-- Grant necessary permissions (public role is used for RLS-authenticated users)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_smtp_settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
