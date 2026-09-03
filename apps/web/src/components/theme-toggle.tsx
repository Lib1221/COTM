'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PALETTES } from '@/lib/appearance';
import { useAppearance, withViewTransition } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { palette, setPalette } = useAppearance();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Avoid hydration mismatch for the resolved color mode icon.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const modes = [
    { id: 'system' as const, label: 'System', icon: Monitor },
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Appearance"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {mounted && resolvedTheme === 'dark' ? (
          <Moon className="h-5 w-5" />
        ) : mounted ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Palette className="h-5 w-5" />
        )}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Color mode
          </p>
          <div className="mb-3 grid grid-cols-3 gap-1">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const active = mounted && theme === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => withViewTransition(() => setTheme(mode.id))}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition-colors hover:bg-accent',
                    active && 'bg-accent text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Site palette
          </p>
          <div className="space-y-1">
            {PALETTES.map((item) => {
              const active = palette === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => withViewTransition(() => setPalette(item.id))}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                    active && 'bg-accent',
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border"
                    style={{ background: item.swatch }}
                    aria-hidden
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
