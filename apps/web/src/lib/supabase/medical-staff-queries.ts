import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import type {
  MedicalStaff,
  Especialidade,
  ProfissaoComConselho,
  StaffOrganization,
} from '@medsync/shared';

/**
 * Comprehensive medical staff detail view including all related data
 */
export interface MedicalStaffDetailView {
  // Personal Information
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  active: boolean | null;
  color: string | null;
  avatar_url: string | null;
  auth_email: string | null;
  user_id: string | null;

  // Professional Registration
  crm: string | null; // Legacy field
  registro_numero: string | null;
  registro_categoria: string | null;
  registro_uf: string | null;

  // Foreign Keys
  especialidade_id: string | null;
  profissao_id: string | null;
  organization_id: string | null;

  // Related Data
  especialidade: Especialidade | null;
  profissao: ProfissaoComConselho | null;

  // Facilities associated with this staff member
  facilities: Array<{
    id: string;
    name: string;
    type: string;
    active: boolean;
    phone: string | null;
    cnpj: string | null;
  }>;

  // Recent shifts (limited to last 10 for performance)
  recentShifts: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: string | null;
    notes: string | null;
    facility_id: string | null;
    sector_id: string | null;
    facility: {
      id: string;
      name: string;
      type: string;
    } | null;
  }>;

  // Organizations this staff member belongs to
  organizations: Array<{
    id: string;
    organization_id: string;
    staff_id: string;
    active: boolean;
    created_at: string;
    organization: {
      id: string;
      name: string;
    } | null;
  }>;

  // Metadata
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Fetches comprehensive medical staff details by ID
 *
 * This function retrieves complete professional profile data including:
 * - Personal information and contact details
 * - Specialty and professional registration
 * - Associated facilities
 * - Recent shift history (last 10 shifts)
 * - Organization memberships
 *
 * **IMPORTANT:** This query respects Row Level Security (RLS) policies.
 * The user must have access to the organization that the staff member belongs to.
 *
 * @param supabase - Authenticated Supabase client with user session
 * @param staffId - UUID of the medical staff member
 * @param organizationId - UUID of the organization (for RLS filtering)
 * @returns Medical staff detail view or null if not found or no access
 *
 * @example
 * ```typescript
 * const staffDetails = await getMedicalStaffById(
 *   supabase,
 *   'staff-uuid-here',
 *   'org-uuid-here'
 * );
 *
 * if (staffDetails) {
 *   console.log('Name:', staffDetails.name);
 *   console.log('Specialty:', staffDetails.especialidade?.nome);
 *   console.log('Facilities:', staffDetails.facilities.length);
 *   console.log('Recent Shifts:', staffDetails.recentShifts.length);
 * }
 * ```
 */
export async function getMedicalStaffById(
  supabase: SupabaseClient<Database>,
  staffId: string,
  organizationId: string
): Promise<MedicalStaffDetailView | null> {
  try {
    // Step 1: Fetch main medical staff record with related data
    // Using nested selects to get especialidade and profissao in a single query
    const { data: staffData, error: staffError } = await supabase
      .from('medical_staff')
      .select(`
        id,
        name,
        email,
        phone,
        cpf,
        active,
        color,
        avatar_url,
        auth_email,
        user_id,
        crm,
        registro_numero,
        registro_categoria,
        registro_uf,
        especialidade_id,
        profissao_id,
        organization_id,
        created_at,
        updated_at,
        especialidade:especialidades (
          id,
          nome,
          created_at
        ),
        profissao:profissoes (
          id,
          nome,
          conselho_id,
          categorias_disponiveis,
          created_at,
          conselho:conselhos_profissionais (
            id,
            sigla,
            nome_completo,
            regex_validacao,
            requer_categoria,
            created_at
          )
        )
      `)
      .eq('id', staffId)
      .single();

    if (staffError) {
      console.error('Error fetching medical staff:', staffError);
      return null;
    }

    if (!staffData) {
      return null;
    }

    // Step 2: Fetch organization links for this staff member
    // RLS will automatically filter to only organizations the user has access to
    const { data: orgLinks, error: orgLinksError } = await supabase
      .from('staff_organizations')
      .select(`
        id,
        organization_id,
        staff_id,
        active,
        created_at,
        organization:organizations (
          id,
          name
        )
      `)
      .eq('staff_id', staffId);

    if (orgLinksError) {
      console.error('Error fetching organization links:', orgLinksError);
    }

    // Verify the staff member belongs to the requested organization
    const hasAccessToOrg = orgLinks?.some(
      (link) => link.organization_id === organizationId
    );

    if (!hasAccessToOrg) {
      console.warn(
        `Staff member ${staffId} does not belong to organization ${organizationId}`
      );
      return null;
    }

    // Step 3: Fetch facilities associated with this staff member
    // Note: facilities are linked via shifts, not a direct many-to-many relationship
    // We'll get unique facilities from shifts
    const { data: shiftsData, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        facility_id,
        sector_id,
        facility:facilities (
          id,
          name,
          type,
          active,
          phone,
          cnpj
        )
      `)
      .eq('staff_id', staffId)
      .eq('organization_id', organizationId)
      .not('facility_id', 'is', null)
      .order('start_time', { ascending: false })
      .limit(50); // Get more to extract unique facilities, then limit shifts below

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
    }

    // Extract unique facilities from shifts
    const facilitiesMap = new Map();
    const recentShifts: MedicalStaffDetailView['recentShifts'] = [];

    shiftsData?.forEach((shift) => {
      // Add to recent shifts (limit to 10)
      if (recentShifts.length < 10 && shift.facility) {
        recentShifts.push({
          id: shift.id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          status: shift.status,
          notes: shift.notes,
          facility_id: shift.facility_id,
          sector_id: shift.sector_id,
          facility: shift.facility
            ? {
                id: shift.facility.id,
                name: shift.facility.name,
                type: shift.facility.type,
              }
            : null,
        });
      }

      // Collect unique facilities
      if (shift.facility && !facilitiesMap.has(shift.facility.id)) {
        facilitiesMap.set(shift.facility.id, {
          id: shift.facility.id,
          name: shift.facility.name,
          type: shift.facility.type,
          active: shift.facility.active,
          phone: shift.facility.phone,
          cnpj: shift.facility.cnpj,
        });
      }
    });

    const facilities = Array.from(facilitiesMap.values());

    // Step 4: Build the comprehensive detail view
    const detailView: MedicalStaffDetailView = {
      // Personal Information
      id: staffData.id,
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      cpf: staffData.cpf,
      active: staffData.active,
      color: staffData.color,
      avatar_url: staffData.avatar_url,
      auth_email: staffData.auth_email,
      user_id: staffData.user_id,

      // Professional Registration
      crm: staffData.crm,
      registro_numero: staffData.registro_numero,
      registro_categoria: staffData.registro_categoria,
      registro_uf: staffData.registro_uf,

      // Foreign Keys
      especialidade_id: staffData.especialidade_id,
      profissao_id: staffData.profissao_id,
      organization_id: staffData.organization_id,

      // Related Data (properly typed)
      especialidade: staffData.especialidade
        ? {
            id: staffData.especialidade.id,
            nome: staffData.especialidade.nome,
            created_at: staffData.especialidade.created_at ?? undefined,
          }
        : null,
      profissao: staffData.profissao
        ? {
            id: staffData.profissao.id,
            nome: staffData.profissao.nome,
            conselho_id: staffData.profissao.conselho_id,
            categorias_disponiveis: staffData.profissao.categorias_disponiveis,
            created_at: staffData.profissao.created_at ?? undefined,
            conselho: staffData.profissao.conselho
              ? {
                  id: staffData.profissao.conselho.id,
                  sigla: staffData.profissao.conselho.sigla,
                  nome_completo: staffData.profissao.conselho.nome_completo,
                  regex_validacao: staffData.profissao.conselho.regex_validacao,
                  requer_categoria: staffData.profissao.conselho.requer_categoria,
                  created_at: staffData.profissao.conselho.created_at ?? undefined,
                }
              : undefined,
          }
        : null,

      // Associated data
      facilities,
      recentShifts,
      organizations: (orgLinks || []).map((link) => ({
        id: link.id,
        organization_id: link.organization_id,
        staff_id: link.staff_id,
        active: link.active,
        created_at: link.created_at,
        organization: link.organization
          ? {
              id: link.organization.id,
              name: link.organization.name,
            }
          : null,
      })),

      // Metadata
      created_at: staffData.created_at,
      updated_at: staffData.updated_at,
    };

    return detailView;
  } catch (error) {
    console.error('Unexpected error in getMedicalStaffById:', error);
    return null;
  }
}

/**
 * Fetches medical staff details for multiple staff members
 * Useful for batch operations or displaying team lists with full details
 *
 * @param supabase - Authenticated Supabase client with user session
 * @param staffIds - Array of medical staff UUIDs
 * @param organizationId - UUID of the organization (for RLS filtering)
 * @returns Array of medical staff detail views (only accessible members)
 *
 * @example
 * ```typescript
 * const staffList = await getMedicalStaffByIds(
 *   supabase,
 *   ['uuid-1', 'uuid-2', 'uuid-3'],
 *   'org-uuid-here'
 * );
 *
 * console.log(`Found ${staffList.length} staff members`);
 * ```
 */
export async function getMedicalStaffByIds(
  supabase: SupabaseClient<Database>,
  staffIds: string[],
  organizationId: string
): Promise<MedicalStaffDetailView[]> {
  const results = await Promise.all(
    staffIds.map((staffId) =>
      getMedicalStaffById(supabase, staffId, organizationId)
    )
  );

  // Filter out null results (staff members user doesn't have access to)
  return results.filter(
    (staff): staff is MedicalStaffDetailView => staff !== null
  );
}
