'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from './UserAvatar';

/**
 * Status type for medical staff availability
 */
export type MedicalStaffStatus = 'online' | 'active' | 'offline' | 'busy';

/**
 * Props for the MedicalStaffHeader component
 */
export interface MedicalStaffHeaderProps {
  /**
   * URL for the staff member's avatar image
   */
  avatarUrl?: string | null;

  /**
   * Full name of the staff member
   */
  name: string;

  /**
   * Primary specialty of the staff member
   */
  specialty?: string | null;

  /**
   * Current status of the staff member
   * @default 'offline'
   */
  status?: MedicalStaffStatus;

  /**
   * Loading state - when true, displays skeleton loader
   * @default false
   */
  loading?: boolean;

  /**
   * Size variant for the avatar
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Status badge variant mapping
 */
const statusVariants: Record<MedicalStaffStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; color: string }> = {
  online: { variant: 'default', label: 'Online', color: 'bg-green-100 text-green-700 border-green-200' },
  active: { variant: 'secondary', label: 'Ativo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  offline: { variant: 'outline', label: 'Offline', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  busy: { variant: 'destructive', label: 'Ocupado', color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

/**
 * Avatar size mapping for skeleton loader
 */
const skeletonSizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12',
};

/**
 * MedicalStaffHeader - Atom component for displaying medical staff header information
 *
 * Displays a professional's avatar, name, specialty, and status badge.
 * Follows atomic design principles as a basic building block.
 *
 * @example
 * ```tsx
 * <MedicalStaffHeader
 *   avatarUrl="https://example.com/avatar.jpg"
 *   name="Dr. João Silva"
 *   specialty="Cardiologia"
 *   status="online"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Loading state
 * <MedicalStaffHeader
 *   name="Loading..."
 *   loading={true}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Without avatar (shows initials)
 * <MedicalStaffHeader
 *   name="Dr. Maria Santos"
 *   specialty="Neurologia"
 *   status="active"
 * />
 * ```
 */
export const MedicalStaffHeader = memo(function MedicalStaffHeader({
  avatarUrl,
  name,
  specialty,
  status = 'offline',
  loading = false,
  size = 'md',
  className,
}: MedicalStaffHeaderProps) {
  const statusConfig = statusVariants[status];

  // Skeleton loading state
  if (loading) {
    return (
      <div
        data-testid="medical-staff-header"
        className={cn('flex items-center gap-3', className)}
      >
        <Skeleton className={cn('rounded-full', skeletonSizes[size])} data-testid="staff-avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" data-testid="staff-name" />
          <Skeleton className="h-4 w-24" data-testid="staff-specialty" />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="medical-staff-header"
      className={cn('flex items-center gap-3', className)}
    >
      {/* Avatar with fallback to initials */}
      <UserAvatar
        name={name}
        avatarUrl={avatarUrl}
        size={size}
        testId="staff-avatar"
      />

      {/* Name, specialty, and status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            data-testid="staff-name"
            className="font-semibold text-sm text-foreground truncate"
          >
            {name}
          </h3>
          <Badge
            data-testid="staff-status"
            className={cn('text-xs px-2 py-0.5', statusConfig.color)}
          >
            {statusConfig.label}
          </Badge>
        </div>
        {specialty && (
          <p
            data-testid="staff-specialty"
            className="text-xs text-muted-foreground mt-0.5 truncate"
          >
            {specialty}
          </p>
        )}
      </div>
    </div>
  );
});
