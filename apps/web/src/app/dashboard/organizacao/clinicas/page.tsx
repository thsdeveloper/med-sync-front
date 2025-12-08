'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { FacilityList } from '@/components/organisms/facilities/FacilityList';
import { FacilitySheet } from '@/components/organisms/facilities/FacilitySheet';
import { Facility } from '@medsync/shared';
import { PageHeader } from '@/components/organisms/page';
import { useOrganization } from '@/providers/OrganizationProvider';

export default function ClinicsPage() {
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [isLoading, setIsLoading] = useState(true);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingFacility, setEditingFacility] = useState<Facility | null>(null);

    const organizationId = activeOrganization?.id ?? null;

    const fetchFacilities = useCallback(async () => {
        if (!organizationId) {
            setFacilities([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const { data: facilitiesData, error: facilitiesError } = await supabase
                .from('facilities')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name');

            if (facilitiesError) throw facilitiesError;
            setFacilities(facilitiesData as Facility[]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados das unidades.');
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        if (!orgLoading) {
            fetchFacilities();
        }
    }, [orgLoading, fetchFacilities]);

    const handleEdit = (facility: Facility) => {
        setEditingFacility(facility);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta unidade?')) return;

        try {
            const { error } = await supabase
                .from('facilities')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFacilities(prev => prev.filter(item => item.id !== id));
            toast.success('Unidade removida com sucesso.');
        } catch (error) {
            console.error('Error deleting facility:', error);
            toast.error('Erro ao excluir unidade.');
        }
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingFacility(null);
    };

    const loading = orgLoading || isLoading;

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
                    <FacilityList
                        facilities={facilities}
                        isLoading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                    onSuccess={fetchFacilities}
                    organizationId={organizationId}
                    facilityToEdit={editingFacility}
                />
            )}
        </div>
    );
}
