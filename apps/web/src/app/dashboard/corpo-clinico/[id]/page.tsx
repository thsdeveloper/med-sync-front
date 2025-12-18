'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, FileText, Award, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MedicalStaffHeader } from '@/components/atoms/MedicalStaffHeader';
import { MedicalStaffInfoCard } from '@/components/molecules/MedicalStaffInfoCard';
import { MedicalStaffShiftHistory } from '@/components/molecules/MedicalStaffShiftHistory';
import { MedicalStaffPerformanceMetrics } from '@/components/organisms/MedicalStaffPerformanceMetrics';
import { useMedicalStaffDetail } from '@/hooks/useMedicalStaffDetail';
import { useOrganization } from '@/providers/OrganizationProvider';
import type { InfoSection } from '@/components/molecules/MedicalStaffInfoCard';
import type { ShiftHistoryItem } from '@/components/molecules/MedicalStaffShiftHistory';
import type { ShiftData } from '@/components/organisms/MedicalStaffPerformanceMetrics';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Page component props with dynamic route parameter
 */
interface MedicalStaffDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * MedicalStaffDetailView Page Component
 *
 * Displays comprehensive details for a single medical staff member including:
 * - Professional header with avatar, name, specialty, and status
 * - Information cards with contact, professional, and document details
 * - Shift history with recent shifts
 * - Performance metrics with charts and statistics
 *
 * @param {MedicalStaffDetailPageProps} props - Page props with route parameters
 * @returns {JSX.Element} Medical staff detail page
 *
 * @example
 * // Route: /dashboard/corpo-clinico/[id]
 * // Automatically rendered by Next.js for route /dashboard/corpo-clinico/123e4567-e89b-12d3-a456-426614174000
 */
export default function MedicalStaffDetailPage({ params }: MedicalStaffDetailPageProps) {
  const { id: medicalStaffId } = React.use(params);
  const router = useRouter();
  const { activeOrganization, loading: orgLoading } = useOrganization();

  // Extract organization ID from active organization
  const organizationId = activeOrganization?.id || null;

  // Fetch medical staff detail data with real-time updates
  const { data: staffData, isLoading, error } = useMedicalStaffDetail(
    medicalStaffId,
    organizationId,
    { enabled: !!organizationId && !orgLoading }
  );

  /**
   * Navigate back to medical staff listing page
   */
  const handleBack = () => {
    router.push('/dashboard/corpo-clinico');
  };

  // Combined loading state
  const loading = orgLoading || isLoading;

  // Error state or staff not found
  if (!loading && (error || !staffData)) {
    return (
      <div className="container mx-auto p-6 max-w-7xl" data-testid="medical-staff-detail-page">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            data-testid="back-button"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 space-y-4" data-testid="error-message">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Profissional não encontrado</h2>
          <p className="text-gray-600 text-center max-w-md">
            O profissional solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Voltar para Lista
          </Button>
        </div>
      </div>
    );
  }

  // Transform staff data into component props
  const headerProps = staffData ? {
    avatarUrl: staffData.avatar_url || null,
    name: staffData.name,
    specialty: staffData.especialidade?.nome || null,
    status: staffData.active ? ('active' as const) : ('offline' as const),
  } : null;

  // Transform staff data into info sections
  const infoSections: InfoSection[] = staffData ? [
    // Contact Information Section
    {
      title: 'Informações de Contato',
      rows: [
        {
          icon: Mail,
          label: 'E-mail',
          value: staffData.email || '—',
        },
        {
          icon: Phone,
          label: 'Telefone',
          value: staffData.phone || '—',
        },
      ],
    },
    // Professional Details Section
    {
      title: 'Detalhes Profissionais',
      rows: [
        {
          icon: Award,
          label: 'Especialidade',
          value: staffData.especialidade?.nome || '—',
        },
        {
          icon: FileText,
          label: 'Profissão',
          value: staffData.profissao?.nome || '—',
        },
        {
          icon: FileText,
          label: 'Conselho',
          value: staffData.profissao?.conselho?.sigla || '—',
        },
        {
          icon: User,
          label: 'Status',
          value: staffData.active ? 'Ativo' : 'Inativo',
        },
      ],
    },
    // Document Information Section
    {
      title: 'Documentos e Registros',
      rows: [
        {
          icon: FileText,
          label: 'CPF',
          value: staffData.cpf || '—',
        },
        {
          icon: Award,
          label: 'Número de Registro',
          value: staffData.registro_numero || staffData.crm || '—',
        },
        {
          icon: FileText,
          label: 'UF do Registro',
          value: staffData.registro_uf || '—',
        },
        {
          icon: FileText,
          label: 'Categoria do Registro',
          value: staffData.registro_categoria || '—',
        },
      ],
    },
  ] : [];

  // Transform recent shifts into ShiftHistoryItem format
  const shiftHistory: ShiftHistoryItem[] = staffData?.recentShifts?.map((shift) => ({
    id: shift.id,
    date: shift.start_time,
    facility: shift.facility?.name || 'Clínica não informada',
    specialty: staffData.especialidade?.nome || null,
    hours: calculateShiftHours(shift.start_time, shift.end_time),
    status: mapShiftStatus(shift.status),
  })) || [];

  // Transform recent shifts into ShiftData format for performance metrics
  const performanceShifts: ShiftData[] = staffData?.recentShifts?.map((shift) => ({
    id: shift.id,
    date: shift.start_time,
    facility: shift.facility?.name || 'Clínica não informada',
    hours: calculateShiftHours(shift.start_time, shift.end_time),
    status: mapShiftStatus(shift.status),
  })) || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl" data-testid="medical-staff-detail-page">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          data-testid="back-button"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Header Section with Professional Info */}
      <div className="mb-8">
        {loading ? (
          <div className="flex items-center space-x-4" data-testid="loading-skeleton">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ) : headerProps ? (
          <MedicalStaffHeader {...headerProps} size="lg" />
        ) : null}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Information Card */}
        <div className="lg:col-span-1">
          <MedicalStaffInfoCard
            sections={infoSections}
            loading={loading}
            title="Informações do Profissional"
          />
        </div>

        {/* Right Column - Shift History and Performance Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shift History */}
          <MedicalStaffShiftHistory
            shifts={shiftHistory}
            loading={loading}
          />

          {/* Performance Metrics */}
          <MedicalStaffPerformanceMetrics
            shifts={performanceShifts}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate hours between shift start and end times
 *
 * @param {string} startTime - ISO 8601 start timestamp
 * @param {string} endTime - ISO 8601 end timestamp
 * @returns {number} Hours worked (rounded to 1 decimal place)
 */
function calculateShiftHours(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 10) / 10; // Round to 1 decimal place
}

/**
 * Map database shift status to component status type
 *
 * @param {string | null} dbStatus - Database status value
 * @returns {'completed' | 'scheduled' | 'cancelled' | 'in_progress'} Component status
 */
function mapShiftStatus(
  dbStatus: string | null
): 'completed' | 'scheduled' | 'cancelled' | 'in_progress' {
  if (!dbStatus) {
    return 'scheduled'; // Default for null/undefined
  }

  switch (dbStatus) {
    case 'completed':
      return 'completed';
    case 'scheduled':
      return 'scheduled';
    case 'cancelled':
      return 'cancelled';
    case 'in_progress':
      return 'in_progress';
    default:
      return 'scheduled'; // Default fallback
  }
}
