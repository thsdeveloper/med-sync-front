'use client';

import { memo, useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  totalResults: number;
  currentResult: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * MessageSearchBar - Search input with navigation controls for chat messages
 */
export const MessageSearchBar = memo(function MessageSearchBar({
  query,
  onQueryChange,
  totalResults,
  currentResult,
  onNext,
  onPrevious,
  onClose,
  className,
}: MessageSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-background border-b',
        className
      )}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar mensagens..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-4"
          aria-label="Buscar mensagens"
        />
      </div>

      {/* Results counter */}
      {query && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalResults > 0
            ? `${currentResult + 1} de ${totalResults}`
            : 'Nenhum resultado'}
        </span>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={totalResults === 0}
          className="h-8 w-8"
          aria-label="Resultado anterior"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={totalResults === 0}
          className="h-8 w-8"
          aria-label="Próximo resultado"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          aria-label="Fechar busca"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
