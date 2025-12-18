'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatSidebar } from '@/components/organisms/chat/ChatSidebar';
import { ChatMessages } from '@/components/organisms/chat/ChatMessages';
import { ChatInput } from '@/components/organisms/chat/ChatInput';
import { ChatLayout, ChatPageLoading } from '@/components/organisms/chat/ChatLayout';
import { useChat } from '@/providers/ChatProvider';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const { conversations, selectConversation, selectedConversationId } = useChat();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Handle URL query parameter
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setActiveId(idFromUrl);
      selectConversation(idFromUrl);
    }
  }, [searchParams, selectConversation]);

  // Auto-select first conversation if none selected (desktop only)
  useEffect(() => {
    if (!activeId && conversations.length > 0 && !searchParams.get('id')) {
      // Only auto-select on desktop
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setActiveId(conversations[0].id);
        selectConversation(conversations[0].id);
      }
    }
  }, [conversations, activeId, selectConversation, searchParams]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      selectConversation(id);
      // Update URL without navigation
      window.history.replaceState({}, '', `/dashboard/chat?id=${id}`);
    },
    [selectConversation]
  );

  const handleBack = useCallback(() => {
    setActiveId(null);
    // Clear URL parameter
    window.history.replaceState({}, '', '/dashboard/chat');
  }, []);

  return (
    <ChatLayout
      selectedId={activeId}
      onBack={handleBack}
      sidebar={
        <ChatSidebar selectedId={activeId} onSelect={handleSelectConversation} />
      }
    >
      {activeId && (
        <>
          <ChatMessages conversationId={activeId} onBack={handleBack} />
          <ChatInput conversationId={activeId} />
        </>
      )}
    </ChatLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
