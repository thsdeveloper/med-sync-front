'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { MedicalStaffList } from '@/components/organisms/medical-staff/MedicalStaffList';
import { MedicalStaffSheet } from '@/components/organisms/medical-staff/MedicalStaffSheet';
import { MedicalStaffWithOrganization } from '@/schemas/medical-staff.schema';
import { PageHeader } from '@/components/organisms/page';
import { useOrganization } from '@/providers/OrganizationProvider';

export default function TeamPage() {
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState<MedicalStaffWithOrganization[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<MedicalStaffWithOrganization | null>(null);

    const organizationId = activeOrganization?.id ?? null;

    const fetchStaff = useCallback(async () => {
        if (!organizationId) {
            setStaff([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

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
                        specialty,
                        role,
                        color,
                        active,
                        created_at,
                        updated_at
                    )
                `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (staffOrgsError) throw staffOrgsError;

            // Para cada profissional, contar em quantas organizações ele está vinculado
            const staffWithOrgCount: MedicalStaffWithOrganization[] = [];

            for (const staffOrg of staffOrgsData || []) {
                const medicalStaff = staffOrg.medical_staff as any;
                if (!medicalStaff) continue;

                // Contar vínculos
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

            // Ordenar por nome
            staffWithOrgCount.sort((a, b) => a.name.localeCompare(b.name));
            setStaff(staffWithOrgCount);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados da equipe.');
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        if (!orgLoading) {
            fetchStaff();
        }
    }, [orgLoading, fetchStaff]);

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
            // 1. Remove o vínculo
            const { error: unlinkError } = await supabase
                .from('staff_organizations')
                .delete()
                .eq('id', staffOrgId);

            if (unlinkError) throw unlinkError;

            // 2. Se era o único vínculo, remove o cadastro do profissional
            if (isOnlyOrg) {
                const { error: deleteError } = await supabase
                    .from('medical_staff')
                    .delete()
                    .eq('id', staffId);

                if (deleteError) {
                    console.error('Error deleting staff:', deleteError);
                }
            }

            setStaff(prev => prev.filter(item => item.id !== staffId));
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
                    <MedicalStaffList
                        staff={staff}
                        isLoading={loading}
                        onEdit={handleEdit}
                        onUnlink={handleUnlink}
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
                    onSuccess={fetchStaff}
                    organizationId={organizationId}
                    staffToEdit={editingStaff}
                />
            )}
        </div>
    );
}
