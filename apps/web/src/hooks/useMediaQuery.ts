'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns whether a media query matches
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

// Breakpoint constants matching Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook that returns responsive breakpoint states for chat layout
 * - isMobile: < 768px (full-screen views, sidebar hidden)
 * - isTablet: 768px - 1023px (collapsible sidebar)
 * - isDesktop: >= 1024px (side-by-side layout)
 */
export function useChatBreakpoints() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
  const isTablet = useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}
