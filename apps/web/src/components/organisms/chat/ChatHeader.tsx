'use client';

import { memo, useState } from 'react';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/atoms';
import { MessageSearchBar } from '@/components/molecules/chat/MessageSearchBar';
import { useChatBreakpoints } from '@/hooks';
import { cn } from '@/lib/utils';
import type { SupportConversationWithDetails, MessageWithSender } from '@medsync/shared';

interface ChatHeaderProps {
  conversation: SupportConversationWithDetails | null;
  onBack?: () => void;
  // Search props
  messages?: MessageWithSender[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchTotalResults?: number;
  searchCurrentResult?: number;
  onSearchNext?: () => void;
  onSearchPrevious?: () => void;
  className?: string;
}

function getConversationTitle(conversation: SupportConversationWithDetails | null): string {
  if (!conversation) return 'Conversa';
  const staffParticipant = conversation.participants?.[0];
  return staffParticipant?.staff?.name || conversation.name || 'Conversa';
}

function getStaffColor(conversation: SupportConversationWithDetails | null): string {
  const staffParticipant = conversation?.participants?.[0];
  return staffParticipant?.staff?.color || '#0066CC';
}

function getStaffAvatarUrl(conversation: SupportConversationWithDetails | null): string | undefined {
  const staffParticipant = conversation?.participants?.[0];
  return staffParticipant?.staff?.avatar_url ?? undefined;
}

/**
 * ChatHeader - Header for chat messages area
 * Includes conversation info, back button (mobile), search toggle, and more options
 */
export const ChatHeader = memo(function ChatHeader({
  conversation,
  onBack,
  messages = [],
  searchQuery = '',
  onSearchQueryChange,
  searchTotalResults = 0,
  searchCurrentResult = 0,
  onSearchNext,
  onSearchPrevious,
  className,
}: ChatHeaderProps) {
  const { isMobile } = useChatBreakpoints();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const title = getConversationTitle(conversation);
  const color = getStaffColor(conversation);
  const avatarUrl = getStaffAvatarUrl(conversation);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    onSearchQueryChange?.('');
  };

  if (isSearchOpen) {
    return (
      <MessageSearchBar
        query={searchQuery}
        onQueryChange={onSearchQueryChange || (() => {})}
        totalResults={searchTotalResults}
        currentResult={searchCurrentResult}
        onNext={onSearchNext || (() => {})}
        onPrevious={onSearchPrevious || (() => {})}
        onClose={handleCloseSearch}
        className={className}
      />
    );
  }

  return (
    <div className={cn('p-4 border-b flex items-center gap-3', className)}>
      {/* Back button - mobile only */}
      {isMobile && onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 flex-shrink-0"
          aria-label="Voltar para conversas"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Conversation info */}
      {conversation && (
        <>
          <UserAvatar
            name={title}
            avatarUrl={avatarUrl}
            color={color}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{title}</h2>
            <p className="text-sm text-muted-foreground truncate">
              Conversa de suporte
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenSearch}
          className="h-9 w-9"
          aria-label="Buscar mensagens"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
});
