'use client';

import * as React from 'react';
import { Download, FileUp, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Radio group subcomponent ──────────────────────────────────────────────

interface RadioOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface RadioGroupProps<T extends string> {
  options: readonly RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}

function RadioGroup<T extends string>({
  options,
  value,
  onChange,
  name,
}: RadioGroupProps<T>) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
              isSelected
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-slate-600 bg-slate-800 hover:bg-slate-750',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                {option.label}
              </span>
              <span className="text-xs text-slate-400">
                {option.description}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}

// ─── Content & Format options ─────────────────────────────────────────────

const CONTENT_OPTIONS = [
  {
    value: 'empty-shell',
    label: 'Empty Shell',
    description: 'Walls only',
  },
  {
    value: 'with-furniture',
    label: 'With Furniture',
    description: 'Walls + furniture placement',
  },
  {
    value: 'materials-only',
    label: 'Materials Only',
    description: 'Wall/floor materials applied',
  },
] as const;

const FORMAT_OPTIONS = [
  {
    value: 'dae',
    label: 'Collada (.dae)',
    description: 'Widely supported 3D interchange format',
  },
  {
    value: 'obj',
    label: 'OBJ (.obj)',
    description: 'Universal mesh format with MTL material reference',
  },
] as const;

type ContentType = (typeof CONTENT_OPTIONS)[number]['value'];
type FormatType = (typeof FORMAT_OPTIONS)[number]['value'];

// ─── Export Dialog ─────────────────────────────────────────────────────────

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [contentType, setContentType] = React.useState<ContentType>('empty-shell');
  const [format, setFormat] = React.useState<FormatType>('dae');
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate a download delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-teal-400" />
            Export 3D Model
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Choose what to export and the file format for SketchUp import.
          </DialogDescription>
        </DialogHeader>

        {/* Content options */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Export Content
          </h4>
          <RadioGroup
            options={CONTENT_OPTIONS}
            value={contentType}
            onChange={setContentType}
            name="export-content"
          />
        </div>

        {/* Format options */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            File Format
          </h4>
          <RadioGroup
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
            name="export-format"
          />
        </div>

        {/* Tips section */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-teal-400">
            <Info className="w-3.5 h-3.5" />
            SketchUp Import
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            File &gt; Import &gt; select <span className="text-slate-300">.dae</span> or{' '}
            <span className="text-slate-300">.obj</span>. Keep default settings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5"
            onClick={handleExport}
            disabled={isExporting}
          >
            <FileUp className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
