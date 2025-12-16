'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useProfissoes } from '@medsync/shared/hooks';
import type { ProfissaoComConselho } from '@medsync/shared/schemas';
import { supabase as defaultSupabase } from '@/lib/supabase';

interface ProfissaoSelectProps {
    value: string;
    onChange: (value: string, profissao?: ProfissaoComConselho) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    supabaseClient?: SupabaseClient;
}

/**
 * ProfissaoSelect - Searchable select component for healthcare professions
 *
 * A molecule component that combines shadcn/ui Command and Popover atoms
 * to create a searchable dropdown for selecting healthcare professions.
 * Each profession is displayed with its associated professional council (conselho).
 *
 * Features:
 * - Search/filter functionality with debounce (300ms)
 * - Displays all profissoes from the database with conselho info
 * - Shows loading and error states
 * - Customizable placeholder and className
 * - Accepts custom Supabase client for flexibility
 * - Returns both the profissao_id and the full profissao object on change
 * - Follows Atomic Design (molecule combining Command, Popover atoms)
 */
export function ProfissaoSelect({
    value,
    onChange,
    disabled = false,
    placeholder = 'Selecione uma profissao...',
    className,
    supabaseClient,
}: ProfissaoSelectProps) {
    const client = supabaseClient ?? defaultSupabase;
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');

    // Debounce search query to reduce API calls
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch profissoes list (filtered by search)
    const { data: profissoes, isLoading, error } = useProfissoes(client, {
        search: debouncedSearch,
    });

    // Check if selected value is in current list
    const selectedInList = React.useMemo(() => {
        return profissoes?.find((p) => p.id === value);
    }, [profissoes, value]);

    // Fetch all profissoes when selected value is not in filtered list
    // This ensures the selected name is always visible
    const { data: allProfissoes } = useProfissoes(client, {
        enabled: !!value && !selectedInList,
    });

    // Get the selected profissao object
    const selectedProfissao = React.useMemo(() => {
        if (selectedInList) {
            return selectedInList;
        }
        return allProfissoes?.find((p) => p.id === value);
    }, [selectedInList, allProfissoes, value]);

    // Get display text for selected profissao
    const displayText = React.useMemo(() => {
        if (!selectedProfissao) return null;
        const conselhoSigla = selectedProfissao.conselho?.sigla;
        return conselhoSigla
            ? `${selectedProfissao.nome} (${conselhoSigla})`
            : selectedProfissao.nome;
    }, [selectedProfissao]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        !value && 'text-muted-foreground',
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {isLoading && !displayText ? (
                            'Carregando profissoes...'
                        ) : displayText ? (
                            displayText
                        ) : (
                            placeholder
                        )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[8rem] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar profissao..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Carregando profissoes...
                            </div>
                        ) : error ? (
                            <div className="py-6 text-center text-sm text-destructive">
                                Erro ao carregar profissoes
                            </div>
                        ) : profissoes && profissoes.length === 0 ? (
                            <CommandEmpty>
                                {searchQuery
                                    ? 'Nenhuma profissao encontrada.'
                                    : 'Nenhuma profissao disponivel.'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {profissoes?.map((profissao) => (
                                    <CommandItem
                                        key={profissao.id}
                                        value={profissao.id}
                                        onSelect={(currentValue) => {
                                            const selectedProf = currentValue === value ? undefined : profissoes.find(p => p.id === currentValue);
                                            onChange(currentValue === value ? '' : currentValue, selectedProf);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none"
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <Check
                                                className={cn(
                                                    'h-4 w-4',
                                                    value === profissao.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        </span>
                                        <span className="flex-1">{profissao.nome}</span>
                                        {profissao.conselho?.sigla && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                {profissao.conselho.sigla}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
