'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MedicalStaffList } from '@/components/organisms/medical-staff/MedicalStaffList';
import { MedicalStaffSheet } from '@/components/organisms/medical-staff/MedicalStaffSheet';
import { MedicalStaff } from '@/schemas/medical-staff.schema';

export default function TeamPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [staff, setStaff] = useState<MedicalStaff[]>([]);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<MedicalStaff | null>(null);

    const fetchOrganizationAndStaff = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 2. Get user's organization
            // TODO: Move this to a global context or hook for performance
            const { data: orgs, error: orgError } = await supabase
                .from('organizations')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (orgError) {
                console.error('Error fetching organization:', orgError);
                // Handle case where user might be a member but not owner (future)
                return;
            }

            if (orgs) {
                setOrganizationId(orgs.id);

                // 3. Get staff
                const { data: staffData, error: staffError } = await supabase
                    .from('medical_staff')
                    .select('*')
                    .eq('organization_id', orgs.id)
                    .order('name');

                if (staffError) throw staffError;
                setStaff(staffData as MedicalStaff[]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados da equipe.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrganizationAndStaff();
    }, [fetchOrganizationAndStaff]);

    const handleEdit = (member: MedicalStaff) => {
        setEditingStaff(member);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este profissional?')) return;

        try {
            const { error } = await supabase
                .from('medical_staff')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStaff(prev => prev.filter(item => item.id !== id));
            toast.success('Profissional removido com sucesso.');
        } catch (error) {
            console.error('Error deleting staff:', error);
            toast.error('Erro ao excluir profissional.');
        }
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setEditingStaff(null);
    };

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Corpo Clínico</h2>
                    <p className="text-muted-foreground">
                        Gerencie os médicos, enfermeiros e técnicos da sua equipe.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsSheetOpen(true)} disabled={isLoading || !organizationId}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Profissional
                    </Button>
                </div>
            </div>

            <div className="flex-1">
                {organizationId ? (
                    <MedicalStaffList
                        staff={staff}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    !isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <div className="p-3 bg-slate-100 rounded-full mb-4">
                                <Users className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma organização encontrada</h3>
                            <p className="text-slate-500 max-w-sm">
                                Parece que você ainda não possui uma organização vinculada. Entre em contato com o suporte.
                            </p>
                        </div>
                    )
                )}
            </div>

            {organizationId && (
                <MedicalStaffSheet
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    onSuccess={fetchOrganizationAndStaff}
                    organizationId={organizationId}
                    staffToEdit={editingStaff}
                />
            )}
        </div>
    );
}

