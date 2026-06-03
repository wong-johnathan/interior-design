'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Search, LogIn, LogOut, LayoutDashboard, Shield } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-teal-700 flex items-center gap-2">
          <Home className="w-5 h-5" />
          <span>HDB Studio</span>
        </Link>
        <Link
          href="/browse"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
        >
          <Search className="w-4 h-4" />
          Browse BTOs
        </Link>
        {session?.user && (
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            My Projects
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 outline-none">
                <span className="text-sm text-slate-600 hidden sm:inline">
                  {session.user.name}
                </span>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-medium">
                    {session.user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{session.user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                My Projects
              </DropdownMenuItem>
              {(session.user as any).role === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                    <Shield className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-amber-600 font-medium">Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" size="sm" onClick={() => signIn('google')}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        )}
      </div>
    </nav>
  );
}
