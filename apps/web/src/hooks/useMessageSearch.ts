'use client';

import { useState, useMemo, useCallback } from 'react';
import type { MessageWithSender } from '@medsync/shared';

interface UseMessageSearchOptions {
  messages: MessageWithSender[];
}

interface UseMessageSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: string[]; // Array of message IDs that match
  currentIndex: number;
  totalResults: number;
  goToNext: () => void;
  goToPrevious: () => void;
  goToResult: (index: number) => void;
  clearSearch: () => void;
  isSearching: boolean;
}

/**
 * Hook for searching within conversation messages
 *
 * Provides local search functionality with navigation between results.
 * Case-insensitive search through message content.
 */
export function useMessageSearch({
  messages,
}: UseMessageSearchOptions): UseMessageSearchReturn {
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find all matching message IDs
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();

    return messages
      .filter((msg) => msg.content.toLowerCase().includes(searchTerm))
      .map((msg) => msg.id);
  }, [messages, query]);

  // Reset current index when results change
  useMemo(() => {
    if (results.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= results.length) {
      setCurrentIndex(results.length - 1);
    }
  }, [results.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % results.length);
  }, [results.length]);

  const goToPrevious = useCallback(() => {
    if (results.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  const goToResult = useCallback(
    (index: number) => {
      if (index >= 0 && index < results.length) {
        setCurrentIndex(index);
      }
    },
    [results.length]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setCurrentIndex(0);
  }, []);

  return {
    query,
    setQuery,
    results,
    currentIndex,
    totalResults: results.length,
    goToNext,
    goToPrevious,
    goToResult,
    clearSearch,
    isSearching: query.trim().length > 0,
  };
}
