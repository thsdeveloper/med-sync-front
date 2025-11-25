'use client';

import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CalendarDays, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/organisms/page';
import { ShiftCalendar } from '@/components/organisms/shifts/ShiftCalendar';
import { ShiftDialog } from '@/components/organisms/shifts/ShiftDialog';
import { SectorsDialog } from '@/components/organisms/shifts/SectorsDialog';
import { Shift, Sector } from '@/schemas/shifts.schema';
import { MedicalStaff } from '@/schemas/medical-staff.schema';

export default function EscalasPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    
    // Data
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [staff, setStaff] = useState<MedicalStaff[]>([]);

    // Dialog States
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // 1. Initialize - Get Org, Sectors, Staff
    const fetchInitialData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: org } = await supabase
                .from('organizations')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (org) {
                setOrganizationId(org.id);
                
                // Fetch Sectors
                const { data: sectorsData } = await supabase
                    .from('sectors')
                    .select('*')
                    .eq('organization_id', org.id)
                    .order('name');
                setSectors(sectorsData as Sector[] || []);

                // Fetch Staff
                const { data: staffData } = await supabase
                    .from('medical_staff')
                    .select('*')
                    .eq('organization_id', org.id)
                    .eq('active', true)
                    .order('name');
                setStaff(staffData as MedicalStaff[] || []);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }, []);

    // 2. Fetch Shifts when Date or Org changes
    const fetchShifts = useCallback(async () => {
        if (!organizationId) return;
        
        try {
            setIsLoading(true);
            
            const start = startOfWeek(startOfMonth(currentDate)).toISOString();
            const end = endOfWeek(endOfMonth(currentDate)).toISOString();

            const { data, error } = await supabase
                .from('shifts')
                .select(`
                    *,
                    sectors (*),
                    medical_staff (name, role, color)
                `)
                .eq('organization_id', organizationId)
                .gte('start_time', start)
                .lte('end_time', end);

            if (error) throw error;
            
            setShifts(data as Shift[]);
        } catch (error) {
            console.error('Error loading shifts:', error);
            toast.error('Erro ao carregar escala.');
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, organizationId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    // Handlers
    const handleAddShift = (date: Date) => {
        setSelectedDate(date);
        setEditingShift(null);
        setIsShiftDialogOpen(true);
    };

    const handleEditShift = (shift: Shift) => {
        setEditingShift(shift);
        setSelectedDate(new Date(shift.start_time));
        setIsShiftDialogOpen(true);
    };

    const handleShiftSuccess = () => {
        fetchShifts();
    };

    const handleSectorUpdate = () => {
        // Refresh sectors list
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

    if (!organizationId && isLoading) {
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
                title="Escala de Plantões"
                description="Gerencie a distribuição de plantões da sua equipe."
                actions={
                    organizationId ? (
                        <SectorsDialog
                            organizationId={organizationId}
                            sectors={sectors}
                            onUpdate={handleSectorUpdate}
                        />
                    ) : undefined
                }
            />

            {organizationId ? (
                <div className="flex-1 min-h-0">
                    <ShiftCalendar 
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        shifts={shifts}
                        sectors={sectors}
                        onAddShift={handleAddShift}
                        onEditShift={handleEditShift}
                        isLoading={isLoading}
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Nenhuma organização encontrada.</p>
                </div>
            )}

            {organizationId && (
                <ShiftDialog 
                    isOpen={isShiftDialogOpen}
                    onClose={() => setIsShiftDialogOpen(false)}
                    onSuccess={handleShiftSuccess}
                    organizationId={organizationId}
                    sectors={sectors}
                    staff={staff}
                    shiftToEdit={editingShift}
                    initialDate={selectedDate}
                />
            )}
        </div>
    );
}

