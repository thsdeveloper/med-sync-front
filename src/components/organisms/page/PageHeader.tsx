'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#2DD4BF] text-white shadow-lg shadow-blue-500/25">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}


