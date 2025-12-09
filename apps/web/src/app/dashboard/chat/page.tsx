'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import { ChatSidebar } from '@/components/organisms/chat/ChatSidebar';
import { ChatMessages } from '@/components/organisms/chat/ChatMessages';
import { ChatInput } from '@/components/organisms/chat/ChatInput';
import { useChat } from '@/providers/ChatProvider';

function ChatPageLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

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

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!activeId && conversations.length > 0 && !searchParams.get('id')) {
      setActiveId(conversations[0].id);
      selectConversation(conversations[0].id);
    }
  }, [conversations, activeId, selectConversation, searchParams]);

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    selectConversation(id);
    // Update URL without navigation
    window.history.replaceState({}, '', `/dashboard/chat?id=${id}`);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-6 -my-6 border-t">
      {/* Sidebar */}
      <ChatSidebar
        selectedId={activeId}
        onSelect={handleSelectConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeId ? (
          <>
            <ChatMessages conversationId={activeId} />
            <ChatInput conversationId={activeId} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Mensagens de Suporte</h2>
            <p className="text-muted-foreground max-w-md">
              Selecione uma conversa na barra lateral para visualizar e responder
              mensagens dos profissionais de saúde.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
