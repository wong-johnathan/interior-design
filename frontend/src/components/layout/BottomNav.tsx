'use client';

import Link from 'next/link';
import { Home, Palette, Sofa, Image } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 md:hidden z-50">
      <Link href="/browse" className="flex flex-col items-center gap-0.5 px-4 py-1 text-teal-600">
        <Home className="w-5 h-5" />
        <span className="text-[10px]">BTOs</span>
      </Link>
      <Link href="/" className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-500">
        <Palette className="w-5 h-5" />
        <span className="text-[10px]">Projects</span>
      </Link>
      <Link href="/studio/demo" className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-500">
        <Sofa className="w-5 h-5" />
        <span className="text-[10px]">Studio</span>
      </Link>
      <Link href="/render/demo" className="flex flex-col items-center gap-0.5 px-4 py-1 text-slate-500">
        <Image className="w-5 h-5" />
        <span className="text-[10px]">Renders</span>
      </Link>
    </nav>
  );
}
