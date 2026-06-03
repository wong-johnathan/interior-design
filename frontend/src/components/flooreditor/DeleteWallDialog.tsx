'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DeleteWallDialogProps {
  wallId: string;
  wallLabel: string;
  onConfirm: (wallId: string) => void;
  onCancel: () => void;
  isStructural?: boolean;
}

export function DeleteWallDialog({ wallId, wallLabel, onConfirm, onCancel, isStructural }: DeleteWallDialogProps) {
  const [open, setOpen] = useState(true);

  if (isStructural) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); setOpen(o); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle className="text-white">Cannot Delete</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400">
              🧱 This is a load-bearing wall and cannot be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onCancel} className="border-slate-600 text-slate-300">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); setOpen(o); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Merge Rooms?</DialogTitle>
          <DialogDescription className="text-slate-400">
            Deleting this wall will merge {wallLabel} with the adjacent room. Continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { onConfirm(wallId); setOpen(false); }}
            className="bg-red-600 hover:bg-red-500"
          >
            Merge Rooms
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
