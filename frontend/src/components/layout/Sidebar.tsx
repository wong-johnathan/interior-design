'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Home, Palette, Sofa, Image, Settings } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const links = [
    { href: '/browse', label: 'Browse BTOs', icon: Home },
    { href: '/', label: 'Projects', icon: Palette },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn('w-56 bg-white border-r border-slate-200 flex flex-col shrink-0', className)}>
      <div className="p-4 border-b border-slate-100">
        <Link href="/" className="text-lg font-bold text-teal-700">
          HDB Studio
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
