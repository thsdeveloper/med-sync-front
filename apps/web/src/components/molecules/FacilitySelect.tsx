'use client';

import * as React from 'react';
import { Check, ChevronDown, Building2, Hospital } from 'lucide-react';

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
import type { Facility } from '@medsync/shared';

interface FacilitySelectProps {
    /** Array of facilities to display */
    facilities: Facility[];
    /** Currently selected facility ID */
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

const FACILITY_TYPE_LABELS: Record<Facility['type'], string> = {
    clinic: 'Clinica',
    hospital: 'Hospital',
};

/**
 * FacilitySelect - Searchable select component for healthcare facilities
 *
 * A molecule component that combines shadcn/ui Command and Popover atoms
 * to create a searchable dropdown for selecting clinics and hospitals.
 */
export function FacilitySelect({
    facilities,
    value,
    onChange,
    disabled = false,
    placeholder = 'Selecione uma unidade...',
    className,
    isLoading = false,
}: FacilitySelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter facilities based on search query
    const filteredFacilities = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return facilities;
        }
        const query = searchQuery.toLowerCase().trim();
        return facilities.filter(
            (facility) =>
                facility.name.toLowerCase().includes(query) ||
                FACILITY_TYPE_LABELS[facility.type].toLowerCase().includes(query)
        );
    }, [facilities, searchQuery]);

    // Get the selected facility
    const selectedFacility = React.useMemo(() => {
        return facilities.find((facility) => facility.id === value);
    }, [facilities, value]);

    const FacilityIcon = ({ type }: { type: Facility['type'] }) => {
        return type === 'hospital' ? (
            <Hospital className="h-4 w-4 text-red-500" />
        ) : (
            <Building2 className="h-4 w-4 text-blue-500" />
        );
    };

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
                            'Carregando unidades...'
                        ) : selectedFacility ? (
                            <>
                                <FacilityIcon type={selectedFacility.type} />
                                {selectedFacility.name}
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
                        placeholder="Buscar unidade..."
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
                                Carregando unidades...
                            </div>
                        ) : filteredFacilities.length === 0 ? (
                            <CommandEmpty>
                                {searchQuery
                                    ? 'Nenhuma unidade encontrada.'
                                    : 'Nenhuma unidade disponivel.'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredFacilities.map((facility) => (
                                    <CommandItem
                                        key={facility.id}
                                        value={facility.id}
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
                                                    value === facility.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <FacilityIcon type={facility.type} />
                                            <span className="flex flex-col">
                                                <span>{facility.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {FACILITY_TYPE_LABELS[facility.type]}
                                                </span>
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
