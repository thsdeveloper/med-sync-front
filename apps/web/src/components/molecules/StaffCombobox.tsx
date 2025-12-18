'use client';

import * as React from 'react';
import { Check, ChevronDown, User } from 'lucide-react';

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

interface StaffOption {
    id: string;
    name: string;
    specialty?: string;
    color?: string;
}

interface StaffComboboxProps {
    /** Array of staff members to display */
    staff: StaffOption[];
    /** Currently selected staff ID */
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
 * StaffCombobox - Searchable select component for medical staff
 *
 * A molecule component that combines shadcn/ui Command and Popover atoms
 * to create a searchable dropdown for selecting medical staff members.
 *
 * Features:
 * - Search/filter functionality by name
 * - Displays staff name with specialty
 * - Shows color indicator for each staff
 * - Shows loading state
 * - Customizable placeholder and className
 * - Follows Atomic Design (molecule combining Command, Popover atoms)
 */
export function StaffCombobox({
    staff,
    value,
    onChange,
    disabled = false,
    placeholder = 'Selecione um profissional...',
    className,
    isLoading = false,
}: StaffComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Filter staff based on search query
    const filteredStaff = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return staff;
        }
        const query = searchQuery.toLowerCase().trim();
        return staff.filter(
            (member) =>
                member.name.toLowerCase().includes(query) ||
                member.specialty?.toLowerCase().includes(query)
        );
    }, [staff, searchQuery]);

    // Get the selected staff member
    const selectedStaff = React.useMemo(() => {
        return staff.find((member) => member.id === value);
    }, [staff, value]);

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
                            'Carregando profissionais...'
                        ) : selectedStaff ? (
                            <>
                                {selectedStaff.color ? (
                                    <span
                                        className="h-3 w-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: selectedStaff.color }}
                                    />
                                ) : (
                                    <User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                )}
                                <span className="truncate">{selectedStaff.name}</span>
                                {selectedStaff.specialty && (
                                    <span className="text-muted-foreground text-xs">
                                        ({selectedStaff.specialty})
                                    </span>
                                )}
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
                        placeholder="Buscar profissional..."
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
                                Carregando profissionais...
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <CommandEmpty>
                                {searchQuery
                                    ? 'Nenhum profissional encontrado.'
                                    : 'Nenhum profissional disponível.'}
                            </CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {filteredStaff.map((member) => (
                                    <CommandItem
                                        key={member.id}
                                        value={member.id}
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
                                                    value === member.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        </span>
                                        <span className="flex items-center gap-2">
                                            {member.color ? (
                                                <span
                                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: member.color }}
                                                />
                                            ) : (
                                                <User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                            )}
                                            <span className="flex flex-col">
                                                <span>{member.name}</span>
                                                {member.specialty && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {member.specialty}
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
