/**
 * UserAvatar Atom Component
 *
 * A performant, reusable avatar component that displays user images
 * with fallback to initials when no image is available.
 *
 * Features:
 * - Image support with automatic fallback to initials
 * - Customizable background color
 * - 5 size variants (xs, sm, md, lg, xl)
 * - Memoized for optimal performance
 * - Error handling for failed image loads
 */

'use client';

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';

/**
 * Size variant configuration
 */
const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
} as const;

/**
 * Default background color when none is provided
 */
const DEFAULT_COLOR = '#64748b'; // slate-500

/**
 * Style variant for the avatar fallback
 * - 'solid': White text on solid colored background
 * - 'soft': Colored text on semi-transparent background
 * - 'gradient': White text on gradient background (uses className for gradient)
 */
type AvatarVariant = 'solid' | 'soft' | 'gradient';

/**
 * Props for the UserAvatar component
 */
export interface UserAvatarProps {
  /** Name of the user (used for initials fallback) */
  name: string;
  /** URL of the avatar image (optional) */
  avatarUrl?: string | null;
  /** Background color for initials fallback */
  color?: string | null;
  /** Size variant */
  size?: keyof typeof SIZE_CLASSES;
  /** Style variant: 'solid' (white text on color), 'soft' (color text on semi-transparent), or 'gradient' (white text, uses className for gradient) */
  variant?: AvatarVariant;
  /** Additional CSS classes */
  className?: string;
  /** Show white border ring */
  showBorder?: boolean;
  /** Custom test ID for testing */
  testId?: string;
}

/**
 * UserAvatar - A performant avatar component with image and initials support
 *
 * @example
 * ```tsx
 * // With image
 * <UserAvatar
 *   name="Dr. João Silva"
 *   avatarUrl="https://example.com/avatar.jpg"
 *   size="md"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With color (shows initials)
 * <UserAvatar
 *   name="Maria Santos"
 *   color="#3B82F6"
 *   size="lg"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Default fallback (slate background with initials)
 * <UserAvatar name="Pedro Costa" />
 * ```
 */
export const UserAvatar = memo(function UserAvatar({
  name,
  avatarUrl,
  color,
  size = 'md',
  variant = 'solid',
  className,
  showBorder = false,
  testId,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Memoize initials calculation
  const initials = useMemo(() => getInitials(name || ''), [name]);

  // Memoize base color
  const baseColor = useMemo(() => color || DEFAULT_COLOR, [color]);

  // Memoize style based on variant
  const fallbackStyle = useMemo(() => {
    if (variant === 'gradient') {
      // No inline style for gradient - uses className for gradient background
      return undefined;
    }
    if (variant === 'soft') {
      return {
        backgroundColor: baseColor + '20', // 20 = 12.5% opacity in hex
        color: baseColor,
      };
    }
    return {
      backgroundColor: baseColor,
    };
  }, [variant, baseColor]);

  // Memoize error handler to prevent re-renders
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Determine if we should show the image
  const shouldShowImage = avatarUrl && !imageError;

  return (
    <Avatar
      className={cn(
        SIZE_CLASSES[size],
        showBorder && 'ring-2 ring-white',
        className
      )}
      data-testid={testId}
    >
      {shouldShowImage && (
        <AvatarImage
          src={avatarUrl}
          alt={name}
          onError={handleImageError}
        />
      )}
      <AvatarFallback
        style={fallbackStyle}
        className={cn(
          'font-medium',
          (variant === 'solid' || variant === 'gradient') && 'text-white'
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});

export default UserAvatar;
