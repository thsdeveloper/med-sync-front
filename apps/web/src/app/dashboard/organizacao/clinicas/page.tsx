'use client';

import { useState, useMemo } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { FacilitySheet } from '@/components/organisms/facilities/FacilitySheet';
import { Facility } from '@medsync/shared';
import { PageHeader } from '@/components/organisms/page';
import { useOrganization } from '@/providers/OrganizationProvider';
import { DataTable } from '@/components/data-table/organisms/DataTable';
import { getClinicasColumns } from '@/components/organisms/clinicas/clinicas-columns';

/**
 * Clinicas Page Component
 *
 * Displays a table of clinics and hospitals (facilities) for the active organization.
 * Features:
 * - TanStack Table integration with sorting, filtering, and pagination
 * - Search by facility name
 * - Filter by active/inactive status
 * - Edit and delete actions
 * - Configurable page sizes: 10, 25, 50, 100
 * - React Query for data fetching and caching
 */
export default function ClinicsPage() {
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    const organizationId = activeOrganization?.id ?? null;

    // Fetch facilities using React Query
    const {
        data: facilities = [],
        isLoading: facilitiesLoading,
        refetch: refetchFacilities,
    } = useQuery({
        queryKey: ['facilities', organizationId],
        queryFn: async () => {
            if (!organizationId) {
                return [];
            }

            const { data, error } = await supabase
                .from('facilities')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name');

            if (error) {
                console.error('Error loading facilities:', error);
                toast.error('Erro ao carregar dados das unidades.');
                throw error;
            }

            return (data as Facility[]) || [];
        },
        enabled: !!organizationId && !orgLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    });

    // Handle edit action
    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility);
        setIsSheetOpen(true);
    };

    // Handle delete action
    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta unidade?')) return;

        try {
            const { error } = await supabase
                .from('facilities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Unidade removida com sucesso.');
            refetchFacilities();
        } catch (error) {
            console.error('Error deleting facility:', error);
            toast.error('Erro ao excluir unidade.');
        }
    };

    // Handle sheet close
    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingFacility(null);
    };

    // Handle successful create/update
    const handleSuccess = () => {
        refetchFacilities();
    };

    // Generate columns with action handlers
    const columns = useMemo(
        () => getClinicasColumns({ onEdit: handleEdit, onDelete: handleDelete }),
        []
    );

    const loading = orgLoading || facilitiesLoading;

    return (
        <div className="flex flex-1 flex-col gap-8">
            <PageHeader
                icon={<Building2 className="h-6 w-6" />}
                title="Clínicas e Hospitais"
                description="Gerencie as unidades de saúde vinculadas à sua organização."
                actions={
                    <Button onClick={() => setIsSheetOpen(true)} disabled={loading || !organizationId}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Unidade
                    </Button>
                }
            />

            <div className="flex-1">
                {organizationId ? (
                    <DataTable
                        data={facilities}
                        columns={columns}
                        isLoading={loading}
                        searchColumn="name"
                        searchPlaceholder="Buscar por nome..."
                        emptyMessage="Nenhuma unidade cadastrada. Comece cadastrando suas clínicas e hospitais."
                        enablePagination={true}
                        enableSorting={true}
                        enableFiltering={true}
                        pageSize={10}
                        pageSizeOptions={[10, 25, 50, 100]}
                        showToolbar={true}
                    />
                ) : (
                    !loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <div className="p-3 bg-slate-100 rounded-full mb-4">
                                <Building2 className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma organização selecionada</h3>
                            <p className="text-slate-500 max-w-sm">
                                Selecione ou crie uma organização no menu lateral para gerenciar as unidades.
                            </p>
                        </div>
                    )
                )}
            </div>

            {organizationId && (
                <FacilitySheet
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    onSuccess={handleSuccess}
                    organizationId={organizationId}
                    facilityToEdit={editingFacility}
                />
            )}
        </div>
    );
}
