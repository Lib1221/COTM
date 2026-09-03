'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 lg:hidden">
        <div
          className="absolute inset-0 bg-black/50 animate-in fade-in"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
        {children}
      </div>
    </SheetContext.Provider>
  );
}

export function SheetContent({
  side = 'left',
  className,
  children,
}: {
  side?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SheetContext);
  return (
    <div
      className={cn(
        'absolute inset-y-0 h-full w-72 border-r bg-sidebar shadow-lg',
        side === 'left'
          ? 'left-0 animate-in slide-in-from-left'
          : 'right-0 animate-in slide-in-from-right',
        className,
      )}
    >
      {children}
      <button
        type="button"
        onClick={() => ctx?.onOpenChange(false)}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
