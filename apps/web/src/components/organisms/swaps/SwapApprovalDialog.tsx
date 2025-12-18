'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/atoms';
import type { ShiftSwapRequestWithDetails, AdminSwapStatus } from '@medsync/shared';

type SwapRequestWithAdminDetails = ShiftSwapRequestWithDetails & {
  admin_status: AdminSwapStatus;
  admin_notes: string | null;
};

type SwapApprovalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  swap: SwapRequestWithAdminDetails | null;
  mode: 'approve' | 'reject';
  onConfirm: (swapId: string, notes: string) => Promise<void>;
};

export function SwapApprovalDialog({
  open,
  onOpenChange,
  swap,
  mode,
  onConfirm,
}: SwapApprovalDialogProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatShiftDate = (dateStr: string) => {
    return format(parseISO(dateStr), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleConfirm = async () => {
    if (!swap) return;

    setIsSubmitting(true);
    try {
      await onConfirm(swap.id, notes);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNotes('');
    }
    onOpenChange(isOpen);
  };

  if (!swap) return null;

  const isApprove = mode === 'approve';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Aprovar Troca de Plantão
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Rejeitar Troca de Plantão
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? 'Confirme a aprovação desta troca de plantão entre os profissionais.'
              : 'Confirme a rejeição desta troca de plantão. Opcionalmente, informe o motivo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Médicos envolvidos */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                name={swap.requester?.name || 'N/A'}
                color={swap.requester?.color}
                size="lg"
              />
              <div className="text-center">
                <p className="font-medium text-sm">{swap.requester?.name}</p>
                <p className="text-xs text-muted-foreground">{swap.requester?.especialidade?.nome}</p>
              </div>
            </div>

            <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />

            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                name={swap.target_staff?.name || 'N/A'}
                color={swap.target_staff?.color}
                size="lg"
              />
              <div className="text-center">
                <p className="font-medium text-sm">{swap.target_staff?.name}</p>
                <p className="text-xs text-muted-foreground">{swap.target_staff?.especialidade?.nome}</p>
              </div>
            </div>
          </div>

          {/* Detalhes dos plantões */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Plantão de {swap.requester?.name?.split(' ')[0]}
              </p>
              <p className="text-sm font-medium">
                {formatShiftDate(swap.original_shift?.start_time || '')}
              </p>
              {swap.original_shift?.sectors && (
                <Badge
                  variant="outline"
                  className="mt-2"
                  style={{
                    borderColor: swap.original_shift.sectors.color,
                    color: swap.original_shift.sectors.color,
                  }}
                >
                  {swap.original_shift.sectors.name}
                </Badge>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">
                Plantão de {swap.target_staff?.name?.split(' ')[0]}
              </p>
              <p className="text-sm font-medium">
                {formatShiftDate(swap.target_shift?.start_time || '')}
              </p>
              {swap.target_shift?.sectors && (
                <Badge
                  variant="outline"
                  className="mt-2"
                  style={{
                    borderColor: swap.target_shift.sectors.color,
                    color: swap.target_shift.sectors.color,
                  }}
                >
                  {swap.target_shift.sectors.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Motivo original */}
          {swap.requester_notes && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Motivo da solicitação:</p>
              <p className="text-sm">{swap.requester_notes}</p>
            </div>
          )}

          {/* Campo de notas do admin */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes">
              {isApprove ? 'Observações (opcional)' : 'Motivo da rejeição (opcional)'}
            </Label>
            <Textarea
              id="admin-notes"
              placeholder={
                isApprove
                  ? 'Adicione observações sobre a aprovação...'
                  : 'Informe o motivo da rejeição...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isSubmitting ? (
              'Processando...'
            ) : isApprove ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar Troca
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar Troca
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
