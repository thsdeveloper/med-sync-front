/**
 * Custom Hook: useFacilityAddressMigration
 *
 * Manages facility address migration from legacy text-based addresses
 * to the new structured format. Uses client-side Supabase calls.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    migrateFacilityAddresses,
    getMigrationStats
} from '@/lib/migrations/migrate-facility-addresses';
import type { MigrationResult } from '@/lib/migrations/migration-logger';

interface MigrationStats {
    totalFacilities: number;
    facilitiesWithAddresses: number;
    facilitiesNeedingMigration: number;
    migratedAddresses: number;
}

interface UseFacilityAddressMigrationReturn {
    stats: MigrationStats | null;
    result: MigrationResult | null;
    isLoading: boolean;
    error: string | null;
    fetchStats: () => Promise<void>;
    runMigration: () => Promise<void>;
}

export function useFacilityAddressMigration(): UseFacilityAddressMigrationReturn {
    const [stats, setStats] = useState<MigrationStats | null>(null);
    const [result, setResult] = useState<MigrationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches migration statistics without running the migration
     */
    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Configuração do Supabase não encontrada');
            }

            const migrationStats = await getMigrationStats(supabaseUrl, supabaseAnonKey);
            setStats(migrationStats);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas';
            setError(errorMessage);
            toast.error('Erro ao buscar estatísticas de migração');
            console.error('Error fetching migration stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Executes the facility address migration
     */
    const runMigration = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Configuração do Supabase não encontrada');
            }

            // Verify user is authenticated
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error('Usuário não autenticado');
            }

            // Execute migration
            toast.info('Iniciando migração de endereços...');
            const migrationResult = await migrateFacilityAddresses(supabaseUrl, supabaseAnonKey);

            setResult(migrationResult);

            // Refresh stats after migration
            await fetchStats();

            if (migrationResult.success) {
                toast.success(`Migração concluída: ${migrationResult.successCount} endereços criados`);
            } else {
                toast.warning(
                    `Migração concluída com erros: ${migrationResult.successCount} sucessos, ${migrationResult.failureCount} erros`
                );
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao executar migração';
            setError(errorMessage);
            toast.error('Erro ao executar migração de endereços');
            console.error('Error running migration:', err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchStats]);

    return {
        stats,
        result,
        isLoading,
        error,
        fetchStats,
        runMigration,
    };
}
