'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Loader2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useChatBreakpoints } from '@/hooks';
import { useChat } from '@/providers/ChatProvider';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  selectedId: string | null;
  onBack?: () => void;
}

/**
 * ChatLayout - Responsive layout template for chat
 *
 * Breakpoints:
 * - Mobile (<768px): Full-screen views, sidebar in Sheet drawer
 * - Tablet (768-1023px): Collapsible sidebar
 * - Desktop (>=1024px): Side-by-side layout
 */
export function ChatLayout({ sidebar, children, selectedId, onBack }: ChatLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useChatBreakpoints();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) {
      setIsSidebarOpen(false);
    } else if (isDesktop) {
      setIsSidebarOpen(true);
    }
  }, [isTablet, isDesktop]);

  // Close mobile sheet when conversation is selected
  useEffect(() => {
    if (selectedId && isMobile) {
      setIsMobileSheetOpen(false);
    }
  }, [selectedId, isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const openMobileSheet = useCallback(() => {
    setIsMobileSheetOpen(true);
  }, []);

  const closeMobileSheet = useCallback(() => {
    setIsMobileSheetOpen(false);
  }, []);

  // Handle back navigation on mobile
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
    setIsMobileSheetOpen(true);
  }, [onBack]);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 -my-6">
        {/* Mobile Sheet for Sidebar */}
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent side="left" className="w-full max-w-none p-0 sm:max-w-none">
            <div className="h-full">{sidebar}</div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        {selectedId ? (
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Show sidebar content directly when no conversation selected */}
            <div className="h-full">{sidebar}</div>
          </div>
        )}
      </div>
    );
  }

  // Tablet & Desktop Layout
  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-6 -my-6 border-t">
      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 border-r transition-all duration-300 ease-in-out overflow-hidden',
          isSidebarOpen ? 'w-80' : 'w-0'
        )}
      >
        <div className="w-80 h-full">{sidebar}</div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toggle Button */}
        <div className="absolute top-2 left-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            aria-label={isSidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {selectedId ? (
          children
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
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
  );
}

/**
 * ChatPageLoading - Loading state for chat page
 */
export function ChatPageLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
