'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RotateCw, Trash2, Copy, Repeat } from 'lucide-react';

interface ContextMenuProps {
  children: React.ReactNode;
}

export function ContextMenu({ children }: ContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-200">
        <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
          <RotateCw className="w-3 h-3" /> Rotate
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
          <Repeat className="w-3 h-3" /> Swap Item
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
          <Copy className="w-3 h-3" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2 text-red-400 cursor-pointer">
          <Trash2 className="w-3 h-3" /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
