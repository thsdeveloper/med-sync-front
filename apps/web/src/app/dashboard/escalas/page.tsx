'use client';

import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CalendarDays, Loader2, Plus, Calendar, ClipboardList, RefreshCw } from 'lucide-react';
import { generateShiftsForCalendarView } from '@/lib/shift-generation';

import { PageHeader } from '@/components/organisms/page';
import { ShiftCalendar } from '@/components/organisms/shifts/ShiftCalendar';
import { SectorsDialog } from '@/components/organisms/shifts/SectorsDialog';
import { FixedScheduleList } from '@/components/organisms/shifts/FixedScheduleList';
import { FixedScheduleDialog } from '@/components/organisms/shifts/FixedScheduleDialog';
import { Button } from '@/components/atoms/Button';
import type { Shift, Sector, MedicalStaff, Facility, FixedSchedule } from '@medsync/shared';
import { useOrganization } from '@/providers/OrganizationProvider';
import { cn } from '@/lib/utils';

type TabType = 'calendar' | 'fixed';

export default function EscalasPage() {
    const { activeOrganization, loading: orgLoading } = useOrganization();
    const [activeTab, setActiveTab] = useState<TabType>('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    
    const organizationId = activeOrganization?.id ?? null;
    
    // Data
    const [shifts, setShifts] = useState<Shift[]>([]);
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

    // Fetch Shifts when Date or Org changes
    const fetchShifts = useCallback(async () => {
        if (!organizationId) {
            setShifts([]);
            setIsLoading(false);
            return;
        }
        
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

    // Fetch Fixed Schedules
    const fetchFixedSchedules = useCallback(async () => {
        if (!organizationId) {
            setFixedSchedules([]);
            return;
        }
        
        try {
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
        }
    }, [organizationId]);

    useEffect(() => {
        if (!orgLoading) {
            fetchBaseData();
        }
    }, [orgLoading, fetchBaseData]);

    useEffect(() => {
        if (!orgLoading) {
            fetchShifts();
        }
    }, [orgLoading, fetchShifts]);

    useEffect(() => {
        if (!orgLoading) {
            fetchFixedSchedules();
        }
    }, [orgLoading, fetchFixedSchedules]);

    // Generate shifts for calendar view when month changes
    const handleDateChange = async (newDate: Date) => {
        setCurrentDate(newDate);
        
        // Generate shifts from fixed schedules for the new month
        if (organizationId && fixedSchedules.length > 0) {
            await generateShiftsForCalendarView(organizationId, newDate);
            // Refresh shifts after generation
            fetchShifts();
        }
    };

    // Manual refresh of generated shifts
    const handleRefreshGeneratedShifts = async () => {
        if (!organizationId) return;
        
        toast.loading('Gerando plantões...', { id: 'generating-shifts' });
        const result = await generateShiftsForCalendarView(organizationId, currentDate);
        toast.dismiss('generating-shifts');
        
        if (result.success) {
            if (result.count > 0) {
                toast.success(`${result.count} plantão(ões) gerado(s).`);
            } else {
                toast.info('Nenhum novo plantão para gerar.');
            }
            fetchShifts();
        } else {
            toast.error('Erro ao gerar plantões.');
        }
    };

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

    const tabs = [
        { id: 'calendar' as const, label: 'Calendário', icon: Calendar },
        { id: 'fixed' as const, label: 'Escalas Fixas', icon: ClipboardList },
    ];

    return (
        <div className="flex flex-col gap-6 min-h-[calc(100vh-4rem)]">
            <PageHeader
                icon={<CalendarDays className="h-6 w-6" />}
                title="Escala de Plantões"
                description="Gerencie a distribuição de plantões da sua equipe."
                actions={
                    organizationId ? (
                        <div className="flex items-center gap-2">
                            {activeTab === 'calendar' && fixedSchedules.length > 0 && (
                                <Button 
                                    variant="outline" 
                                    onClick={handleRefreshGeneratedShifts}
                                    title="Gerar plantões das escalas fixas"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Gerar Plantões
                                </Button>
                            )}
                            {activeTab === 'fixed' && (
                                <Button onClick={handleAddFixedSchedule}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Escala Fixa
                                </Button>
                            )}
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
                <>
                    {/* Tabs */}
                    <div className="border-b border-slate-200">
                        <nav className="flex gap-1" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                                            isActive
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 min-h-0">
                        {activeTab === 'calendar' ? (
                            <ShiftCalendar 
                                currentDate={currentDate}
                                onDateChange={handleDateChange}
                                shifts={shifts}
                                sectors={sectors}
                                isLoading={loading}
                            />
                        ) : (
                            <FixedScheduleList
                                schedules={fixedSchedules}
                                facilities={facilities}
                                isLoading={loading}
                                onEdit={handleEditFixedSchedule}
                                onDelete={handleFixedScheduleDelete}
                            />
                        )}
                    </div>
                </>
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
