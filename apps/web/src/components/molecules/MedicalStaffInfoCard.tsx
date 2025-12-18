'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Represents a single information row with icon, label, and value
 */
export interface InfoRow {
  /** Lucide React icon component */
  icon: LucideIcon;
  /** Label text for the information row */
  label: string;
  /** Value to display (can be string, number, or React node for custom rendering) */
  value: string | number | React.ReactNode;
  /** Optional unique key for the row (useful for rendering lists) */
  key?: string;
}

/**
 * Represents a section containing a title and multiple information rows
 */
export interface InfoSection {
  /** Section title */
  title: string;
  /** Array of information rows to display in this section */
  rows: InfoRow[];
  /** Optional unique key for the section */
  key?: string;
}

/**
 * Props for the MedicalStaffInfoCard component
 */
export interface MedicalStaffInfoCardProps {
  /** Array of information sections to display */
  sections: InfoSection[];
  /** Loading state to show skeleton loaders */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional title for the entire card */
  title?: string;
}

/**
 * MedicalStaffInfoCard - Molecule component for displaying categorized medical staff information
 *
 * Displays multiple information sections with icons, labels, and values.
 * Implements responsive grid layout (1 column mobile, 2 columns desktop).
 * Supports loading skeleton state.
 *
 * @example
 * ```tsx
 * import { Mail, Phone, Award, FileText } from 'lucide-react';
 *
 * const sections: InfoSection[] = [
 *   {
 *     title: 'Informações de Contato',
 *     rows: [
 *       { icon: Mail, label: 'E-mail', value: 'doctor@example.com' },
 *       { icon: Phone, label: 'Telefone', value: '(11) 98765-4321' },
 *     ],
 *   },
 *   {
 *     title: 'Detalhes Profissionais',
 *     rows: [
 *       { icon: Award, label: 'CRM', value: '123456-SP' },
 *       { icon: FileText, label: 'Especialidade', value: 'Cardiologia' },
 *     ],
 *   },
 * ];
 *
 * <MedicalStaffInfoCard sections={sections} />
 * ```
 *
 * @example With loading state
 * ```tsx
 * <MedicalStaffInfoCard sections={[]} loading={true} />
 * ```
 *
 * @example With card title
 * ```tsx
 * <MedicalStaffInfoCard
 *   title="Informações do Profissional"
 *   sections={sections}
 * />
 * ```
 */
export const MedicalStaffInfoCard = React.memo<MedicalStaffInfoCardProps>(
  ({ sections, loading = false, className, title }) => {
    if (loading) {
      return (
        <Card className={cn('w-full', className)} data-testid="info-card">
          {title && (
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="space-y-6">
            {/* Skeleton for 2 sections */}
            {[1, 2].map((sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Separator />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Skeleton for 4 rows per section */}
                  {[1, 2, 3, 4].map((rowIndex) => (
                    <div key={rowIndex} className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn('w-full', className)} data-testid="info-card">
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const sectionKey = section.key || `section-${sectionIndex}`;

            return (
              <div
                key={sectionKey}
                className="space-y-4"
                data-testid="info-section"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {section.title}
                </h3>
                <Separator />

                {/* Responsive grid: 1 column mobile, 2 columns desktop */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.rows.map((row, rowIndex) => {
                    const rowKey = row.key || `${sectionKey}-row-${rowIndex}`;
                    const Icon = row.icon;

                    return (
                      <div
                        key={rowKey}
                        className="flex items-start gap-3"
                        data-testid="info-row"
                      >
                        <Icon
                          className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400 mt-0.5"
                          data-testid="info-row-icon"
                          aria-hidden="true"
                        />
                        <div className="flex-1 min-w-0">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {row.label}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-words">
                            {row.value || '—'}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && !loading && (
            <div
              className="text-center py-8 text-sm text-gray-500"
              data-testid="info-card-empty"
            >
              Nenhuma informação disponível
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

MedicalStaffInfoCard.displayName = 'MedicalStaffInfoCard';
