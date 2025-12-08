import { WEEKDAYS, DURATION_TYPE_LABELS, type DurationType } from '../schemas/fixed-schedule.schema';

export function formatWeekdays(weekdays: number[]): string {
    const sorted = [...weekdays].sort((a, b) => a - b);

    if (sorted.length === 7) return 'Todos os dias';

    if (sorted.length === 5 &&
        sorted.every((d, i) => d === i + 1)) {
        return 'Seg a Sex';
    }

    if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) {
        return 'Fim de semana';
    }

    return sorted
        .map(d => WEEKDAYS.find(w => w.value === d)?.label)
        .filter(Boolean)
        .join(', ');
}

export function formatDuration(durationType: DurationType, endDate: string | null): string {
    if (durationType === 'permanent') return 'Permanente';

    if (endDate) {
        const date = new Date(endDate + 'T12:00:00');
        return `Até ${date.toLocaleDateString('pt-BR')}`;
    }

    return DURATION_TYPE_LABELS[durationType];
}

export function formatCNPJ(cnpj: string): string {
    const digits = cnpj.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}
