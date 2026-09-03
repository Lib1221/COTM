'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import type { Dashboard } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<Dashboard>('/dashboard'),
    refetchInterval: 60_000,
  });

  const alerts = data?.inventory.lowStock ?? [];
  const count = data?.inventory.lowStockCount ?? 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={count > 0 ? `${count} low-stock alerts` : 'No stock alerts'}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning" />
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-popover p-2 text-popover-foreground shadow-lg">
          <p className="px-2 py-1.5 text-sm font-medium">Yard alerts</p>
          {alerts.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              All materials are above minimum stock.
            </p>
          ) : (
            <ul className="space-y-1">
              {alerts.map((material) => (
                <li key={material.id}>
                  <Link
                    href="/materials"
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{material.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {material.currentStock} / {material.minimumStock}{' '}
                      {material.unit}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
