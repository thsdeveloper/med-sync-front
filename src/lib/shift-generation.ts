import { supabase } from '@/lib/supabase';
import { 
    addMonths, 
    startOfMonth, 
    endOfMonth, 
    format 
} from 'date-fns';

/**
 * Gera shifts automáticos a partir de uma escala fixa específica
 * para o mês atual e o próximo
 */
export async function generateShiftsFromFixedSchedule(
    fixedScheduleId: string
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const today = new Date();
        const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(addMonths(today, 1)), 'yyyy-MM-dd');

        const { data, error } = await supabase.rpc('generate_shifts_from_fixed_schedule', {
            p_fixed_schedule_id: fixedScheduleId,
            p_start_date: startDate,
            p_end_date: endDate,
        });

        if (error) throw error;

        return { success: true, count: data || 0 };
    } catch (error: any) {
        console.error('Error generating shifts from fixed schedule:', error);
        return { success: false, count: 0, error: error.message };
    }
}

/**
 * Gera shifts automáticos de todas as escalas fixas ativas de uma organização
 * para um período específico
 */
export async function generateShiftsForOrganization(
    organizationId: string,
    startDate: Date,
    endDate: Date
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const { data, error } = await supabase.rpc('generate_shifts_for_organization', {
            p_organization_id: organizationId,
            p_start_date: format(startDate, 'yyyy-MM-dd'),
            p_end_date: format(endDate, 'yyyy-MM-dd'),
        });

        if (error) throw error;

        return { success: true, count: data || 0 };
    } catch (error: any) {
        console.error('Error generating shifts for organization:', error);
        return { success: false, count: 0, error: error.message };
    }
}

/**
 * Gera shifts para o período visualizado no calendário
 * Chamado quando o usuário navega para um novo mês
 */
export async function generateShiftsForCalendarView(
    organizationId: string,
    viewDate: Date
): Promise<{ success: boolean; count: number; error?: string }> {
    const startDate = startOfMonth(viewDate);
    const endDate = endOfMonth(viewDate);
    
    return generateShiftsForOrganization(organizationId, startDate, endDate);
}

/**
 * Remove shifts futuros de uma escala fixa
 * Usado quando uma escala fixa é alterada ou deletada
 */
export async function deleteFutureShiftsFromFixedSchedule(
    fixedScheduleId: string
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const { data, error } = await supabase.rpc('delete_future_shifts_from_fixed_schedule', {
            p_fixed_schedule_id: fixedScheduleId,
        });

        if (error) throw error;

        return { success: true, count: data || 0 };
    } catch (error: any) {
        console.error('Error deleting future shifts:', error);
        return { success: false, count: 0, error: error.message };
    }
}

