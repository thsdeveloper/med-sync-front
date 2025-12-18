'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/providers/ChatProvider';
import { useSupabaseAuth } from '@/providers/SupabaseAuthProvider';
import { useTypingIndicator } from '@/hooks';
import { toast } from 'sonner';

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const { sendMessage } = useChat();
  const { user } = useSupabaseAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Typing indicator
  const { startTyping, stopTyping } = useTypingIndicator({
    conversationId,
    userId: user?.id || '',
    userName: 'Administrador',
    enabled: !!user?.id,
  });

  // Handle text change with typing indicator
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);

      // Broadcast typing status
      if (value.trim()) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const content = message.trim();
    setMessage('');

    // Stop typing indicator when sending
    stopTyping();

    try {
      await sendMessage(conversationId, content);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(content);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSending(false);
      // Focus back on textarea
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Stop typing when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [conversationId, stopTyping]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
          disabled={isSending}
          aria-label="Mensagem"
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 flex-shrink-0"
          disabled={!message.trim() || isSending}
          aria-label="Enviar mensagem"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </form>
  );
}
