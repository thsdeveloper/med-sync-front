'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from './SupabaseAuthProvider';

const STORAGE_KEY = 'medsync_active_organization_id';

export type UserOrganizationRole = 'owner' | 'admin' | 'member';

export type Organization = {
    id: string;
    name: string;
    cnpj: string;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
    created_at: string;
};

export type UserOrganization = {
    id: string;
    organization_id: string;
    role: UserOrganizationRole;
    created_at: string;
    organization: Organization;
};

type OrganizationContextValue = {
    organizations: UserOrganization[];
    activeOrganization: Organization | null;
    activeRole: UserOrganizationRole | null;
    loading: boolean;
    setActiveOrganization: (organizationId: string) => void;
    refreshOrganizations: () => Promise<void>;
    createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
};

type CreateOrganizationData = {
    name: string;
    cnpj: string;
    address?: string;
    phone?: string;
};

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);
    const { user, loading: authLoading } = useSupabaseAuth();

    const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
    const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Carregar organizações do usuário
    const loadOrganizations = useCallback(async () => {
        if (!user) {
            setOrganizations([]);
            setActiveOrganizationId(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_organizations')
                .select(`
                    id,
                    organization_id,
                    role,
                    created_at,
                    organization:organizations (
                        id,
                        name,
                        cnpj,
                        address,
                        phone,
                        logo_url,
                        created_at
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const userOrgs = (data || []).map((item: any) => ({
                id: item.id,
                organization_id: item.organization_id,
                role: item.role as UserOrganizationRole,
                created_at: item.created_at,
                organization: item.organization as Organization,
            }));

            setOrganizations(userOrgs);

            // Restaurar organização ativa do localStorage ou usar a primeira
            const savedOrgId = localStorage.getItem(STORAGE_KEY);
            const validSavedOrg = userOrgs.find(uo => uo.organization_id === savedOrgId);

            if (validSavedOrg) {
                setActiveOrganizationId(validSavedOrg.organization_id);
            } else if (userOrgs.length > 0) {
                setActiveOrganizationId(userOrgs[0].organization_id);
                localStorage.setItem(STORAGE_KEY, userOrgs[0].organization_id);
            } else {
                setActiveOrganizationId(null);
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Erro ao carregar organizações:', error);
            setOrganizations([]);
            setActiveOrganizationId(null);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // Carregar organizações quando o usuário mudar
    useEffect(() => {
        if (!authLoading) {
            loadOrganizations();
        }
    }, [authLoading, loadOrganizations]);

    // Trocar organização ativa
    const setActiveOrganization = useCallback((organizationId: string) => {
        const exists = organizations.find(uo => uo.organization_id === organizationId);
        if (exists) {
            setActiveOrganizationId(organizationId);
            localStorage.setItem(STORAGE_KEY, organizationId);
        }
    }, [organizations]);

    // Criar nova organização
    const createOrganization = useCallback(async (data: CreateOrganizationData): Promise<Organization> => {
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // 1. Criar a organização
        const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: data.name,
                cnpj: data.cnpj,
                address: data.address || null,
                phone: data.phone || null,
                owner_id: user.id, // Manter para compatibilidade
            })
            .select()
            .single();

        if (orgError) throw orgError;

        // 2. Criar o vínculo user_organizations como owner
        const { error: linkError } = await supabase
            .from('user_organizations')
            .insert({
                user_id: user.id,
                organization_id: newOrg.id,
                role: 'owner',
            });

        if (linkError) {
            // Rollback: deletar a organização criada
            await supabase.from('organizations').delete().eq('id', newOrg.id);
            throw linkError;
        }

        // 3. Recarregar organizações e ativar a nova
        await loadOrganizations();
        setActiveOrganization(newOrg.id);

        return newOrg as Organization;
    }, [user, supabase, loadOrganizations, setActiveOrganization]);

    // Organização e papel ativos
    const activeUserOrg = useMemo(() => {
        return organizations.find(uo => uo.organization_id === activeOrganizationId);
    }, [organizations, activeOrganizationId]);

    const value = useMemo<OrganizationContextValue>(() => ({
        organizations,
        activeOrganization: activeUserOrg?.organization ?? null,
        activeRole: activeUserOrg?.role ?? null,
        loading: authLoading || loading,
        setActiveOrganization,
        refreshOrganizations: loadOrganizations,
        createOrganization,
    }), [
        organizations,
        activeUserOrg,
        authLoading,
        loading,
        setActiveOrganization,
        loadOrganizations,
        createOrganization,
    ]);

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization deve ser usado dentro de um OrganizationProvider');
    }
    return context;
};

