'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
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
import { useEspecialidades } from '@medsync/shared/hooks';
import { supabase } from '@/lib/supabase';

interface EspecialidadeComboboxProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/**
 * EspecialidadeCombobox - Searchable select component for medical specialties
 *
 * A molecule component that combines shadcn/ui Command and Popover atoms
 * to create a searchable dropdown for selecting medical specialties.
 *
 * Features:
 * - Search/filter functionality
 * - Displays all especialidades from the database
 * - Shows loading and error states
 * - Follows Atomic Design (molecule combining Button, Command, Popover atoms)
 */
export function EspecialidadeCombobox({
    value,
    onChange,
    disabled = false,
}: EspecialidadeComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Fetch especialidades using the shared hook
    const { data: especialidades, isLoading, error } = useEspecialidades(supabase, {
        search: searchQuery,
    });

    // Find the selected especialidade to display its name
    const selectedEspecialidade = React.useMemo(() => {
        return especialidades?.find((esp) => esp.id === value);
    }, [especialidades, value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between',
                        !value && 'text-muted-foreground'
                    )}
                    disabled={disabled}
                >
                    {isLoading ? (
                        'Carregando especialidades...'
                    ) : selectedEspecialidade ? (
                        selectedEspecialidade.nome
                    ) : (
                        'Selecione uma especialidade...'
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar especialidade..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Carregando especialidades...
                            </div>
                        ) : error ? (
                            <div className="py-6 text-center text-sm text-destructive">
                                Erro ao carregar especialidades
                            </div>
                        ) : especialidades && especialidades.length === 0 ? (
                            <CommandEmpty>
                                {searchQuery
                                    ? 'Nenhuma especialidade encontrada.'
                                    : 'Nenhuma especialidade disponível.'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {especialidades?.map((especialidade) => (
                                    <CommandItem
                                        key={especialidade.id}
                                        value={especialidade.id}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? '' : currentValue);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                value === especialidade.id
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        {especialidade.nome}
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
