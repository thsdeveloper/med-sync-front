'use client';

import { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { MedicalStaffSheet } from '@/components/organisms/medical-staff/MedicalStaffSheet';
import type { MedicalStaffWithOrganization } from '@medsync/shared';
import { PageHeader } from '@/components/organisms/page';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table/organisms/DataTable';
import { getMedicalStaffColumns } from '@/components/organisms/medical-staff/medical-staff-columns';

export default function TeamPage() {
    const router = useRouter();
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<MedicalStaffWithOrganization | null>(null);

    const organizationId = activeOrganization?.id ?? null;

    // React Query hook for fetching medical staff data
    const {
        data: staff = [],
        isLoading,
        refetch: refetchStaff,
    } = useQuery({
        queryKey: ['medical-staff', organizationId],
        queryFn: async () => {
            if (!organizationId) {
                return [];
            }

            // Get staff via staff_organizations
            const { data: staffOrgsData, error: staffOrgsError } = await supabase
                .from('staff_organizations')
                .select(`
                    id,
                    staff_id,
                    organization_id,
                    active,
                    created_at,
                    medical_staff (
                        id,
                        name,
                        email,
                        phone,
                        crm,
                        especialidade_id,
                        profissao_id,
                        color,
                        active,
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
                            conselho:conselhos_profissionais (
                                sigla
                            )
                        )
                    )
                `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (staffOrgsError) throw staffOrgsError;

            // For each professional, count how many organizations they are linked to
            const staffWithOrgCount: MedicalStaffWithOrganization[] = [];

            for (const staffOrg of staffOrgsData || []) {
                const medicalStaff = staffOrg.medical_staff as any;
                if (!medicalStaff) continue;

                // Count links
                const { count } = await supabase
                    .from('staff_organizations')
                    .select('*', { count: 'exact', head: true })
                    .eq('staff_id', staffOrg.staff_id);

                staffWithOrgCount.push({
                    ...medicalStaff,
                    staff_organization: {
                        id: staffOrg.id,
                        staff_id: staffOrg.staff_id,
                        organization_id: staffOrg.organization_id,
                        active: staffOrg.active,
                        created_at: staffOrg.created_at,
                    },
                    organization_count: count || 1,
                });
            }

            // Sort by name
            staffWithOrgCount.sort((a, b) => a.name.localeCompare(b.name));
            return staffWithOrgCount;
        },
        enabled: !orgLoading && !!organizationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const handleEdit = (member: MedicalStaffWithOrganization) => {
        setEditingStaff(member);
        setIsSheetOpen(true);
    };

    const handleUnlink = async (staffId: string, staffOrgId: string, organizationCount: number) => {
        const isOnlyOrg = organizationCount <= 1;
        const confirmMessage = isOnlyOrg
            ? 'Este profissional só está vinculado à sua organização. Ao desvincular, o cadastro será excluído. Deseja continuar?'
            : 'Deseja desvincular este profissional da sua organização? O cadastro será mantido em outras organizações.';

        if (!window.confirm(confirmMessage)) return;

        try {
            // 1. Remove the link
            const { error: unlinkError } = await supabase
                .from('staff_organizations')
                .delete()
                .eq('id', staffOrgId);

            if (unlinkError) throw unlinkError;

            // 2. If it was the only link, remove the professional's record
            if (isOnlyOrg) {
                const { error: deleteError } = await supabase
                    .from('medical_staff')
                    .delete()
                    .eq('id', staffId);

                if (deleteError) {
                    console.error('Error deleting staff:', deleteError);
                }
            }

            refetchStaff();
            toast.success(isOnlyOrg ? 'Profissional removido com sucesso.' : 'Profissional desvinculado com sucesso.');
        } catch (error) {
            console.error('Error unlinking staff:', error);
            toast.error('Erro ao desvincular profissional.');
        }
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingStaff(null);
    };

    const handleViewDetails = (staffId: string) => {
        router.push(`/dashboard/corpo-clinico/${staffId}`);
    };

    // Create column definitions with action handlers using useMemo
    const columns = useMemo(
        () =>
            getMedicalStaffColumns({
                onEdit: handleEdit,
                onUnlink: handleUnlink,
                onViewDetails: handleViewDetails,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const loading = orgLoading || isLoading;

    return (
        <div className="flex flex-1 flex-col gap-8">
            <PageHeader
                icon={<Users className="h-6 w-6" />}
                title="Corpo Clínico"
                description="Gerencie os médicos, enfermeiros e técnicos vinculados à sua organização."
                actions={
                    <Button onClick={() => setIsSheetOpen(true)} disabled={loading || !organizationId}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Profissional
                    </Button>
                }
            />

            <div className="flex-1">
                {organizationId ? (
                    <DataTable
                        data={staff}
                        columns={columns}
                        isLoading={loading}
                        enablePagination={true}
                        enableSorting={true}
                        enableFiltering={true}
                        searchColumn="name"
                        searchPlaceholder="Buscar por nome, função, especialidade ou CRM..."
                        showToolbar={true}
                        pageSizeOptions={[10, 25, 50, 100]}
                        pageSize={10}
                        emptyMessage="Nenhum profissional vinculado. Cadastre ou vincule profissionais à sua organização."
                    />
                ) : (
                    !loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <div className="p-3 bg-slate-100 rounded-full mb-4">
                                <Users className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma organização selecionada</h3>
                            <p className="text-slate-500 max-w-sm">
                                Selecione ou crie uma organização no menu lateral para gerenciar a equipe.
                            </p>
                        </div>
                    )
                )}
            </div>

            {organizationId && (
                <MedicalStaffSheet
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    onSuccess={refetchStaff}
                    organizationId={organizationId}
                    staffToEdit={editingStaff}
                />
            )}
        </div>
    );
}
