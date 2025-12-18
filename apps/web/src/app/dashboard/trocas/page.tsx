'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/atoms';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { SwapApprovalDialog } from '@/components/organisms/swaps/SwapApprovalDialog';
import type { ShiftSwapRequestWithDetails, AdminSwapStatus } from '@medsync/shared';

type SwapRequestWithAdminDetails = ShiftSwapRequestWithDetails & {
  admin_status: AdminSwapStatus;
  admin_notes: string | null;
};

export default function TrocasPage() {
  const supabase = getSupabaseBrowserClient();
  const { user } = useSupabaseAuth();
  const { activeOrganization } = useOrganization();

  const [swapRequests, setSwapRequests] = useState<SwapRequestWithAdminDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequestWithAdminDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject'>('approve');

  const loadSwapRequests = useCallback(async () => {
    if (!activeOrganization?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .select(`
          *,
          requester:medical_staff!shift_swap_requests_requester_id_fkey (
            id, name, color, especialidade:especialidades(nome)
          ),
          target_staff:medical_staff!shift_swap_requests_target_staff_id_fkey (
            id, name, color, especialidade:especialidades(nome)
          ),
          original_shift:shifts!shift_swap_requests_original_shift_id_fkey (
            id, start_time, end_time, status,
            sectors (name, color)
          ),
          target_shift:shifts!shift_swap_requests_target_shift_id_fkey (
            id, start_time, end_time, status,
            sectors (name, color)
          )
        `)
        .eq('organization_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading swap requests:', error);
        toast.error('Erro ao carregar solicitações de troca');
        return;
      }

      setSwapRequests(data || []);
    } catch (error) {
      console.error('Error loading swap requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganization?.id, supabase]);

  useEffect(() => {
    loadSwapRequests();
  }, [loadSwapRequests]);

  // Subscribe para atualizações em tempo real
  useEffect(() => {
    if (!activeOrganization?.id) return;

    const channel = supabase
      .channel(`swap_requests:${activeOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
          filter: `organization_id=eq.${activeOrganization.id}`,
        },
        () => {
          loadSwapRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrganization?.id, supabase, loadSwapRequests]);

  const handleApprove = async (swapId: string, notes: string) => {
    if (!user?.id) return;

    try {
      // Buscar o swap request completo
      const swap = swapRequests.find((s) => s.id === swapId);
      if (!swap) return;

      // 1. Trocar os staff_id entre os shifts
      const { error: swapError1 } = await supabase
        .from('shifts')
        .update({ staff_id: swap.target_staff?.id })
        .eq('id', swap.original_shift_id);

      if (swapError1) throw swapError1;

      const { error: swapError2 } = await supabase
        .from('shifts')
        .update({ staff_id: swap.requester?.id })
        .eq('id', swap.target_shift_id);

      if (swapError2) throw swapError2;

      // 2. Atualizar o swap request
      const { error: updateError } = await supabase
        .from('shift_swap_requests')
        .update({
          admin_status: 'admin_approved',
          admin_id: user.id,
          admin_notes: notes || null,
          admin_responded_at: new Date().toISOString(),
        })
        .eq('id', swapId);

      if (updateError) throw updateError;

      // 3. Criar notificações para os médicos
      const notifications = [
        {
          organization_id: activeOrganization?.id,
          staff_id: swap.requester_id,
          type: 'shift_swap_admin_approved',
          title: 'Troca de plantão aprovada',
          body: `Sua solicitação de troca foi aprovada pelo administrador.`,
          data: { swap_request_id: swapId },
        },
        {
          organization_id: activeOrganization?.id,
          staff_id: swap.target_staff_id,
          type: 'shift_swap_admin_approved',
          title: 'Troca de plantão aprovada',
          body: `A troca de plantão foi aprovada pelo administrador.`,
          data: { swap_request_id: swapId },
        },
      ];

      await supabase.from('notifications').insert(notifications);

      toast.success('Troca aprovada com sucesso!');
      setDialogOpen(false);
      loadSwapRequests();
    } catch (error) {
      console.error('Error approving swap:', error);
      toast.error('Erro ao aprovar troca');
    }
  };

  const handleReject = async (swapId: string, notes: string) => {
    if (!user?.id) return;

    try {
      const swap = swapRequests.find((s) => s.id === swapId);
      if (!swap) return;

      // 1. Atualizar o swap request
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({
          admin_status: 'admin_rejected',
          admin_id: user.id,
          admin_notes: notes || null,
          admin_responded_at: new Date().toISOString(),
        })
        .eq('id', swapId);

      if (error) throw error;

      // 2. Criar notificações para os médicos
      const notifications = [
        {
          organization_id: activeOrganization?.id,
          staff_id: swap.requester_id,
          type: 'shift_swap_admin_rejected',
          title: 'Troca de plantão rejeitada',
          body: notes ? `Motivo: ${notes}` : 'Sua solicitação de troca foi rejeitada pelo administrador.',
          data: { swap_request_id: swapId },
        },
        {
          organization_id: activeOrganization?.id,
          staff_id: swap.target_staff_id,
          type: 'shift_swap_admin_rejected',
          title: 'Troca de plantão rejeitada',
          body: notes ? `Motivo: ${notes}` : 'A troca de plantão foi rejeitada pelo administrador.',
          data: { swap_request_id: swapId },
        },
      ];

      await supabase.from('notifications').insert(notifications);

      toast.success('Troca rejeitada');
      setDialogOpen(false);
      loadSwapRequests();
    } catch (error) {
      console.error('Error rejecting swap:', error);
      toast.error('Erro ao rejeitar troca');
    }
  };

  const openApprovalDialog = (swap: SwapRequestWithAdminDetails, mode: 'approve' | 'reject') => {
    setSelectedSwap(swap);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const getStatusBadge = (swap: SwapRequestWithAdminDetails) => {
    const { admin_status, status } = swap;

    if (admin_status === 'admin_approved') {
      return <Badge className="bg-green-100 text-green-800">Aprovada</Badge>;
    }
    if (admin_status === 'admin_rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejeitada</Badge>;
    }
    if (admin_status === 'pending_admin') {
      return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Aprovação</Badge>;
    }
    if (status === 'declined') {
      return <Badge className="bg-gray-100 text-gray-800">Recusada pelo Médico</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-blue-100 text-blue-800">Aguardando Médico</Badge>;
    }

    return <Badge variant="secondary">{status}</Badge>;
  };

  const formatShiftDate = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Filtrar por status
  const pendingApproval = swapRequests.filter((s) => s.admin_status === 'pending_admin');
  const approved = swapRequests.filter((s) => s.admin_status === 'admin_approved');
  const rejected = swapRequests.filter(
    (s) => s.admin_status === 'admin_rejected' || s.status === 'declined'
  );
  const pending = swapRequests.filter(
    (s) => s.admin_status === 'pending_staff' && s.status === 'pending'
  );

  const renderSwapCard = (swap: SwapRequestWithAdminDetails) => (
    <Card key={swap.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Informações da troca */}
          <div className="flex-1 space-y-4">
            {/* Médicos envolvidos */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserAvatar
                  name={swap.requester?.name || 'N/A'}
                  color={swap.requester?.color}
                  size="md"
                />
                <div>
                  <p className="font-medium">{swap.requester?.name}</p>
                  <p className="text-xs text-muted-foreground">{swap.requester?.especialidade?.nome}</p>
                </div>
              </div>

              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />

              <div className="flex items-center gap-2">
                <UserAvatar
                  name={swap.target_staff?.name || 'N/A'}
                  color={swap.target_staff?.color}
                  size="md"
                />
                <div>
                  <p className="font-medium">{swap.target_staff?.name}</p>
                  <p className="text-xs text-muted-foreground">{swap.target_staff?.especialidade?.nome}</p>
                </div>
              </div>
            </div>

            {/* Detalhes dos plantões */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Plantão de {swap.requester?.name?.split(' ')[0]}</p>
                <p className="font-medium">{formatShiftDate(swap.original_shift?.start_time || '')}</p>
                {swap.original_shift?.sectors && (
                  <Badge
                    variant="outline"
                    className="mt-1"
                    style={{ borderColor: swap.original_shift.sectors.color, color: swap.original_shift.sectors.color }}
                  >
                    {swap.original_shift.sectors.name}
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Plantão de {swap.target_staff?.name?.split(' ')[0]}</p>
                <p className="font-medium">{formatShiftDate(swap.target_shift?.start_time || '')}</p>
                {swap.target_shift?.sectors && (
                  <Badge
                    variant="outline"
                    className="mt-1"
                    style={{ borderColor: swap.target_shift.sectors.color, color: swap.target_shift.sectors.color }}
                  >
                    {swap.target_shift.sectors.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Notas */}
            {swap.requester_notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Motivo: </span>
                <span>{swap.requester_notes}</span>
              </div>
            )}

            {swap.admin_notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notas do admin: </span>
                <span>{swap.admin_notes}</span>
              </div>
            )}
          </div>

          {/* Status e ações */}
          <div className="flex flex-col items-end gap-3">
            {getStatusBadge(swap)}

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(parseISO(swap.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </div>

            {swap.admin_status === 'pending_admin' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => openApprovalDialog(swap, 'reject')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => openApprovalDialog(swap, 'approve')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trocas de Plantão</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de troca de plantão entre os profissionais
          </p>
        </div>
        <Button variant="outline" onClick={loadSwapRequests} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="pending_admin" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending_admin" className="relative">
            Aguardando Aprovação
            {pendingApproval.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {pendingApproval.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending_staff">
            Aguardando Médico ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovadas ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending_admin" className="space-y-4">
          {pendingApproval.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">Nenhuma troca pendente</CardTitle>
                <CardDescription>
                  Quando médicos solicitarem e aceitarem trocas, elas aparecerão aqui para sua aprovação
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            pendingApproval.map(renderSwapCard)
          )}
        </TabsContent>

        <TabsContent value="pending_staff" className="space-y-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">Nenhuma solicitação pendente</CardTitle>
                <CardDescription>
                  Solicitações aguardando resposta do médico convidado aparecerão aqui
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            pending.map(renderSwapCard)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approved.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">Nenhuma troca aprovada</CardTitle>
                <CardDescription>Trocas aprovadas aparecerão aqui</CardDescription>
              </CardContent>
            </Card>
          ) : (
            approved.map(renderSwapCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejected.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-lg mb-2">Nenhuma troca rejeitada</CardTitle>
                <CardDescription>Trocas rejeitadas aparecerão aqui</CardDescription>
              </CardContent>
            </Card>
          ) : (
            rejected.map(renderSwapCard)
          )}
        </TabsContent>
      </Tabs>

      <SwapApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        swap={selectedSwap}
        mode={dialogMode}
        onConfirm={dialogMode === 'approve' ? handleApprove : handleReject}
      />
    </div>
  );
}
