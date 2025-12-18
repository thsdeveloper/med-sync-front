'use client';

import { useState, useMemo } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChat } from '@/providers/ChatProvider';
import { ConversationListItem } from '@/components/molecules/chat/ConversationListItem';
import type { SupportConversationWithDetails } from '@medsync/shared';

interface ChatSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getConversationName(conv: SupportConversationWithDetails): string {
  const staffParticipant = conv.participants?.[0];
  return staffParticipant?.staff?.name || conv.name || 'Conversa';
}

export function ChatSidebar({ selectedId, onSelect }: ChatSidebarProps) {
  const { conversations, isLoading } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const name = getConversationName(conv).toLowerCase();
      return name.includes(query);
    });
  }, [conversations, searchQuery]);

  if (isLoading) {
    return <ChatSidebarSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <h2 className="font-semibold text-lg mb-3">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Buscar conversas"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <EmptyConversations hasSearch={!!searchQuery} />
        ) : (
          <div className="divide-y" role="listbox" aria-label="Lista de conversas">
            {filteredConversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EmptyConversations({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">
        {hasSearch ? 'Nenhuma conversa encontrada' : 'Nenhuma mensagem de suporte'}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasSearch
          ? 'Tente buscar por outro termo'
          : 'Mensagens dos profissionais aparecerão aqui'}
      </p>
    </div>
  );
}

function ChatSidebarSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-24 mb-3" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
