'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  Home,
  Sofa,
  Users,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Building2, label: 'BTO Projects', href: '/admin/projects' },
  { icon: Home, label: 'Flat Models', href: '/admin/flat-models' },
  { icon: Sofa, label: 'Furniture', href: '/admin/furniture' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  // Auth check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/login');
    return null;
  }

  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-500 mb-6">
            You don&apos;t have admin privileges. Contact your administrator to request access.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  // Derive breadcrumb from path
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-30',
          sidebarWidth
        )}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          {collapsed ? (
            <span className="text-amber-600 font-bold text-lg mx-auto">H</span>
          ) : (
            <Link href="/admin" className="text-amber-700 font-bold text-base flex items-center gap-2">
              <span className="bg-amber-600 text-white rounded-lg w-7 h-7 flex items-center justify-center text-sm font-bold">
                H
              </span>
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-amber-600' : 'text-slate-400')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('flex-1 transition-all duration-200', collapsed ? 'ml-16' : 'ml-60')}>
        {/* Header with breadcrumb */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-20">
          <div className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-slate-800 font-medium">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-slate-400 hover:text-slate-600">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
