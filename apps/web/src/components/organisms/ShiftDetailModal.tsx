/**
 * ShiftDetailModal Organism Component
 *
 * Displays detailed information about a selected shift in a modal dialog.
 * Shows doctor information, facility details, time, specialty, status, and notes.
 *
 * Usage:
 * ```tsx
 * import { ShiftDetailModal } from '@/components/organisms/ShiftDetailModal';
 *
 * function MyComponent() {
 *   const [selectedShift, setSelectedShift] = useState<CalendarEvent | null>(null);
 *
 *   return (
 *     <ShiftDetailModal
 *       shift={selectedShift}
 *       open={!!selectedShift}
 *       onOpenChange={(open) => !open && setSelectedShift(null)}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';

/**
 * Props for the ShiftDetailModal component
 */
export interface ShiftDetailModalProps {
  /** The shift to display (null to hide modal) */
  shift: CalendarEvent | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Returns a badge variant based on shift status
 */
function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'concluído') {
    return 'default'; // Success (primary color)
  }
  if (normalizedStatus === 'cancelled' || normalizedStatus === 'cancelado') {
    return 'destructive';
  }
  if (normalizedStatus === 'pending' || normalizedStatus === 'pendente') {
    return 'outline';
  }
  if (normalizedStatus === 'accepted' || normalizedStatus === 'aceito') {
    return 'secondary';
  }

  return 'outline';
}

/**
 * Returns a human-readable Portuguese status label
 */
function getStatusLabel(status: string): string {
  const normalizedStatus = status.toLowerCase();

  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    pendente: 'Pendente',
    accepted: 'Aceito',
    aceito: 'Aceito',
    completed: 'Concluído',
    concluído: 'Concluído',
    cancelled: 'Cancelado',
    cancelado: 'Cancelado',
  };

  return statusMap[normalizedStatus] || status;
}

/**
 * Returns a capitalized specialty label
 */
function getSpecialtyLabel(specialty: string): string {
  if (!specialty) return 'Geral';

  // Capitalize first letter
  return specialty.charAt(0).toUpperCase() + specialty.slice(1).toLowerCase();
}

/**
 * ShiftDetailModal - Modal dialog for displaying shift details
 *
 * This organism component shows comprehensive information about a selected shift,
 * including doctor name, facility, date/time, specialty, status, and notes.
 *
 * @param props - Modal configuration props
 * @returns Modal dialog component
 */
export function ShiftDetailModal({
  shift,
  open,
  onOpenChange,
}: ShiftDetailModalProps) {
  // Don't render anything if no shift is selected
  if (!shift) {
    return null;
  }

  const {
    title,
    startDate,
    endDate,
    doctor_name,
    facility_name,
    facility_address,
    specialty,
    status,
    notes,
  } = shift;

  // Format dates for display
  const formattedDate = format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedStartTime = format(startDate, 'HH:mm', { locale: ptBR });
  const formattedEndTime = format(endDate, 'HH:mm', { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detalhes do plantão selecionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Doctor Information */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Médico
              </p>
              <p className="text-base font-semibold">
                {doctor_name || 'Não atribuído'}
              </p>
            </div>
          </div>

          {/* Facility Information */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Unidade
              </p>
              <p className="text-base font-semibold">
                {facility_name || 'N/A'}
              </p>
              {facility_address && facility_address.trim() !== '' && (
                <p className="text-sm text-muted-foreground mt-1">
                  {facility_address}
                </p>
              )}
            </div>
          </div>

          {/* Date Information */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Data</p>
              <p className="text-base font-semibold">{formattedDate}</p>
            </div>
          </div>

          {/* Time Information */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Horário
              </p>
              <p className="text-base font-semibold">
                {formattedStartTime} - {formattedEndTime}
              </p>
            </div>
          </div>

          {/* Specialty Information */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Especialidade
              </p>
              <p className="text-base font-semibold">
                {getSpecialtyLabel(specialty)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge variant={getStatusVariant(status)} className="mt-1">
                {getStatusLabel(status)}
              </Badge>
            </div>
          </div>

          {/* Notes */}
          {notes && notes.trim() !== '' && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Observações
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Export component as default
 */
export default ShiftDetailModal;
