'use client';

import {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Check, ChevronsUpDown, Palette } from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const BRAND_COLORS = [
    { color: '#2563EB', name: 'Primary' },
    { color: '#2DD4BF', name: 'Secondary' },
];

const DEFAULT_COLORS = [
    '#000000',
    '#434343',
    '#666666',
    '#999999',
    '#CCCCCC',
    '#FFFFFF',
    '#FF3B30',
    '#FF6B81',
    '#FF2DD1',
    '#B715FF',
    '#6C63FF',
    '#30A6FF',
    '#3ED0FF',
    '#00B8D9',
    '#0F62FE',
    '#0043CE',
    '#00C06A',
    '#2DD36F',
    '#9FE870',
    '#FFC857',
    '#FF9B52',
    '#FF7B00',
    '#F97316',
    '#FACC15',
];

type ColorPickerProps = {
    value?: string;
    onChange: (color: string) => void;
    presetColors?: string[];
    className?: string;
};

export const ColorPicker = forwardRef<HTMLInputElement | null, ColorPickerProps>(
    ({ value = '#2563eb', onChange, presetColors = DEFAULT_COLORS, className }, ref) => {
        const hiddenInputRef = useRef<HTMLInputElement>(null);
        const [isOpen, setIsOpen] = useState(false);

        useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
            ref,
            () => hiddenInputRef.current,
            [],
        );

        const handleSelectColor = useCallback(
            (color: string) => {
                if (color !== value) {
                    onChange(color);
                }
                setIsOpen(false);
            },
            [onChange, value],
        );

        const handleOpenPalette = useCallback(() => {
            hiddenInputRef.current?.click();
        }, []);

        const normalizedValue = useMemo(() => value || '#2563eb', [value]);

        return (
            <div className={cn('w-full', className)}>
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-4 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-12 w-12 rounded-xl border shadow-inner"
                                    style={{ backgroundColor: normalizedValue }}
                                />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Cor selecionada</p>
                                    <p className="text-xs uppercase text-muted-foreground">{normalizedValue}</p>
                                </div>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        sideOffset={8}
                        className="w-[280px] border-none bg-transparent p-0 shadow-none"
                    >
                        <div className="rounded-2xl border bg-background p-4 shadow-lg">
                            <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#2563EB] to-[#2DD4BF] p-3">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                                <div className="relative mb-2">
                                    <p className="text-sm font-semibold leading-tight text-white">Cores da marca</p>
                                    <p className="text-xs text-white/70">MedSync</p>
                                </div>
                                <div className="relative flex gap-2">
                                    {BRAND_COLORS.map(({ color, name }) => {
                                        const isActive = normalizedValue.toLowerCase() === color.toLowerCase();
                                        return (
                                            <button
                                                type="button"
                                                key={color}
                                                aria-label={`Selecionar cor ${name}`}
                                                aria-pressed={isActive}
                                                className={cn(
                                                    'group relative flex h-10 flex-1 items-center justify-center rounded-lg border-2 shadow-md transition will-change-transform',
                                                    isActive
                                                        ? 'border-white ring-2 ring-white/50'
                                                        : 'border-white/30 hover:scale-[1.02] hover:border-white/60',
                                                )}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleSelectColor(color)}
                                            >
                                                {isActive && (
                                                    <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                                                )}
                                                <span className="absolute -bottom-5 text-[10px] font-semibold text-white/80 opacity-0 transition group-hover:opacity-100">
                                                    {name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold leading-tight">Cores padrão</p>
                                <p className="text-xs text-muted-foreground">Sólidas</p>
                            </div>

                            <div className="mt-3 grid grid-cols-6 gap-2">
                                {presetColors.map((color) => {
                                    const isActive = normalizedValue.toLowerCase() === color.toLowerCase();
                                    return (
                                        <button
                                            type="button"
                                            key={color}
                                            aria-label={`Selecionar cor ${color}`}
                                            aria-pressed={isActive}
                                            className={cn(
                                                'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition will-change-transform',
                                                isActive
                                                    ? 'border-blue-600 ring-2 ring-blue-100'
                                                    : 'border-transparent hover:scale-[1.03]',
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => handleSelectColor(color)}
                                        >
                                            {isActive && (
                                                <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-center gap-2"
                                    onClick={handleOpenPalette}
                                >
                                    <Palette className="h-4 w-4" />
                                    Escolher na paleta
                                </Button>
                                <input
                                    ref={hiddenInputRef}
                                    type="color"
                                    className="sr-only"
                                    value={normalizedValue}
                                    onChange={(event) => handleSelectColor(event.target.value)}
                                />
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    },
);

ColorPicker.displayName = 'ColorPicker';

