'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

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
import type { Sector } from '@medsync/shared';

interface SectorSelectProps {
    /** Array of sectors to display */
    sectors: Sector[];
    /** Currently selected sector ID */
    value: string;
    /** Callback when selection changes */
    onChange: (value: string) => void;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Placeholder text when no selection */
    placeholder?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether the data is loading */
    isLoading?: boolean;
}

/**
 * SectorSelect - Searchable select component for hospital sectors
 *
 * A molecule component that combines shadcn/ui Command and Popover atoms
 * to create a searchable dropdown for selecting hospital sectors.
 *
 * Features:
 * - Search/filter functionality
 * - Displays all sectors passed as props
 * - Shows color indicator for each sector
 * - Shows loading state
 * - Customizable placeholder and className
 * - Follows Atomic Design (molecule combining Command, Popover atoms)
 */
export function SectorSelect({
    sectors,
    value,
    onChange,
    disabled = false,
    placeholder = 'Selecione um setor...',
    className,
    isLoading = false,
}: SectorSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter sectors based on search query
    const filteredSectors = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return sectors;
        }
        const query = searchQuery.toLowerCase().trim();
        return sectors.filter(
            (sector) =>
                sector.name.toLowerCase().includes(query) ||
                sector.description?.toLowerCase().includes(query)
        );
    }, [sectors, searchQuery]);

    // Get the name of the selected sector
    const selectedSector = React.useMemo(() => {
        return sectors.find((sector) => sector.id === value);
    }, [sectors, value]);

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
                    disabled={disabled || isLoading}
                >
                    <span className="flex items-center gap-2 truncate">
                        {isLoading ? (
                            'Carregando setores...'
                        ) : selectedSector ? (
                            <>
                                <span
                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: selectedSector.color }}
                                />
                                {selectedSector.name}
                            </>
                        ) : (
                            placeholder
                        )}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[8rem] p-0"
                align="start"
                onWheel={(e) => e.stopPropagation()}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar setor..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList
                        className="max-h-[300px] overflow-y-auto"
                        onWheel={(e) => {
                            e.stopPropagation();
                            const target = e.currentTarget;
                            target.scrollTop += e.deltaY;
                        }}
                    >
                        {isLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Carregando setores...
                            </div>
                        ) : filteredSectors.length === 0 ? (
                            <CommandEmpty>
                                {searchQuery
                                    ? 'Nenhum setor encontrado.'
                                    : 'Nenhum setor disponível.'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredSectors.map((sector) => (
                                    <CommandItem
                                        key={sector.id}
                                        value={sector.id}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue === value ? '' : currentValue);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none"
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <Check
                                                className={cn(
                                                    'h-4 w-4',
                                                    value === sector.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="h-3 w-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: sector.color }}
                                            />
                                            <span className="flex flex-col">
                                                <span>{sector.name}</span>
                                                {sector.description && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                        {sector.description}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
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
