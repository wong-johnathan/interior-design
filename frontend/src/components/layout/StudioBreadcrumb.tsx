'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface StudioBreadcrumbProps {
  items: BreadcrumbItem[];
  projectName?: string;
  projectInfo?: string;
}

export function StudioBreadcrumb({ items, projectName, projectInfo }: StudioBreadcrumbProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
      <div className="flex items-center gap-1 text-sm">
        {projectName && (
          <>
            <Link href="/" className="text-slate-400 hover:text-slate-300 text-xs">
              ← Dashboard
            </Link>
            <span className="text-slate-600 mx-1">/</span>
          </>
        )}
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  'text-xs',
                  item.isActive
                    ? 'text-teal-400 font-medium'
                    : 'text-slate-400 hover:text-slate-300'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-xs',
                  item.isActive ? 'text-teal-400 font-medium' : 'text-slate-400'
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        ))}
      </div>
      {projectInfo && (
        <div className="text-xs text-slate-500 hidden sm:block">{projectInfo}</div>
      )}
    </div>
  );
}
