'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Plus } from 'lucide-react';

import { PageHeader } from '@/components/organisms/page';
import { FixedScheduleList } from '@/components/organisms/shifts/FixedScheduleList';
import { FixedScheduleDialog } from '@/components/organisms/shifts/FixedScheduleDialog';
import { SectorsDialog } from '@/components/organisms/shifts/SectorsDialog';
import { Button } from '@/components/atoms/Button';
import type { Sector, MedicalStaff, Facility, FixedSchedule } from '@medsync/shared';
import { useOrganization } from '@/providers/OrganizationProvider';

export default function EscalasPage() {
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [isLoading, setIsLoading] = useState(true);

    const organizationId = activeOrganization?.id ?? null;

    // Data
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [staff, setStaff] = useState<MedicalStaff[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [fixedSchedules, setFixedSchedules] = useState<FixedSchedule[]>([]);

    // Fixed Schedule Dialog States
    const [isFixedScheduleDialogOpen, setIsFixedScheduleDialogOpen] = useState(false);
    const [editingFixedSchedule, setEditingFixedSchedule] = useState<FixedSchedule | null>(null);

    // Fetch base data (Sectors, Staff, Facilities) when org changes
    const fetchBaseData = useCallback(async () => {
        if (!organizationId) {
            setSectors([]);
            setStaff([]);
            setFacilities([]);
            return;
        }

        try {
            // Fetch Sectors
            const { data: sectorsData } = await supabase
                .from('sectors')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name');
            setSectors(sectorsData as Sector[] || []);

            // Fetch Staff via staff_organizations (apenas ativos nesta org)
            const { data: staffOrgsData } = await supabase
                .from('staff_organizations')
                .select(`
                    medical_staff (
                        id, name, email, phone, crm, specialty, role, color, active, created_at, updated_at
                    )
                `)
                .eq('organization_id', organizationId)
                .eq('active', true);

            const staffList = (staffOrgsData || [])
                .map((so: any) => so.medical_staff)
                .filter((s: any): s is MedicalStaff => s !== null && typeof s === 'object' && !Array.isArray(s))
                .sort((a, b) => a.name.localeCompare(b.name));

            setStaff(staffList);

            // Fetch Facilities
            const { data: facilitiesData } = await supabase
                .from('facilities')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('active', true)
                .order('name');
            setFacilities(facilitiesData as Facility[] || []);
        } catch (error) {
            console.error('Error loading base data:', error);
        }
    }, [organizationId]);

    // Fetch Fixed Schedules
    const fetchFixedSchedules = useCallback(async () => {
        if (!organizationId) {
            setFixedSchedules([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('fixed_schedules')
                .select(`
                    *,
                    facilities (*),
                    medical_staff (id, name, role, color),
                    sectors (*)
                `)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setFixedSchedules(data as FixedSchedule[]);
        } catch (error) {
            console.error('Error loading fixed schedules:', error);
            toast.error('Erro ao carregar escalas fixas.');
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        if (!orgLoading) {
            fetchBaseData();
        }
    }, [orgLoading, fetchBaseData]);

    useEffect(() => {
        if (!orgLoading) {
            fetchFixedSchedules();
        }
    }, [orgLoading, fetchFixedSchedules]);

    const handleSectorUpdate = () => {
        if (organizationId) {
            supabase
                .from('sectors')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name')
                .then(({ data }) => {
                    if (data) setSectors(data as Sector[]);
                });
        }
    };

    // Handlers - Fixed Schedules
    const handleAddFixedSchedule = () => {
        setEditingFixedSchedule(null);
        setIsFixedScheduleDialogOpen(true);
    };

    const handleEditFixedSchedule = (schedule: FixedSchedule) => {
        setEditingFixedSchedule(schedule);
        setIsFixedScheduleDialogOpen(true);
    };

    const handleFixedScheduleSuccess = () => {
        fetchFixedSchedules();
    };

    const handleFixedScheduleDelete = () => {
        fetchFixedSchedules();
    };

    const loading = orgLoading || isLoading;

    if (loading && !organizationId) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 min-h-[calc(100vh-4rem)]">
            <PageHeader
                icon={<CalendarDays className="h-6 w-6" />}
                title="Escalas Fixas"
                description="Gerencie as escalas fixas da sua equipe médica."
                actions={
                    organizationId ? (
                        <div className="flex items-center gap-2">
                            <Button onClick={handleAddFixedSchedule}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Escala Fixa
                            </Button>
                            <SectorsDialog
                                organizationId={organizationId}
                                sectors={sectors}
                                onUpdate={handleSectorUpdate}
                            />
                        </div>
                    ) : undefined
                }
            />

            {organizationId ? (
                <div className="flex-1 min-h-0">
                    <FixedScheduleList
                        schedules={fixedSchedules}
                        facilities={facilities}
                        isLoading={loading}
                        onEdit={handleEditFixedSchedule}
                        onDelete={handleFixedScheduleDelete}
                    />
                </div>
            ) : (
                !loading && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Selecione ou crie uma organização para gerenciar as escalas.</p>
                    </div>
                )
            )}

            {/* Fixed Schedule Dialog */}
            {organizationId && (
                <FixedScheduleDialog
                    isOpen={isFixedScheduleDialogOpen}
                    onClose={() => setIsFixedScheduleDialogOpen(false)}
                    onSuccess={handleFixedScheduleSuccess}
                    organizationId={organizationId}
                    facilities={facilities}
                    staff={staff}
                    sectors={sectors}
                    scheduleToEdit={editingFixedSchedule}
                    onStaffRefresh={fetchBaseData}
                />
            )}
        </div>
    );
}
