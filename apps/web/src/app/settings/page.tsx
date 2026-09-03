'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PALETTES } from '@/lib/appearance';
import { useAppearance, withViewTransition } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette, density, setDensity, motion, setMotion } =
    useAppearance();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Appearance and workspace preferences for this browser."
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in on this workstation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{user?.name}</p>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="font-mono text-xs text-primary">{user?.role}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color mode</CardTitle>
          <CardDescription>
            Follow the operating system, or pin light or dark for this site.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[
            { id: 'system', label: 'System', icon: Monitor },
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
          ].map((mode) => {
            const Icon = mode.icon;
            const active = theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => withViewTransition(() => setTheme(mode.id))}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent',
                  active && 'border-primary bg-accent',
                )}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site palette</CardTitle>
          <CardDescription>
            Four construction palettes. Hi-Vis is the yard default.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {PALETTES.map((item) => {
            const active = palette === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => withViewTransition(() => setPalette(item.id))}
                className={cn(
                  'rounded-lg border p-4 text-left hover:bg-accent',
                  active && 'border-primary bg-accent',
                )}
              >
                <span
                  className="mb-3 block h-8 w-full rounded-md"
                  style={{ background: item.swatch }}
                />
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Density</CardTitle>
          <CardDescription>
            Compact packing for dense BOQ and inventory tables.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {(['comfortable', 'compact'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDensity(value)}
              className={cn(
                'rounded-lg border px-3 py-3 text-left text-sm capitalize hover:bg-accent',
                density === value && 'border-primary bg-accent',
              )}
            >
              {value}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motion</CardTitle>
          <CardDescription>
            Reduce animation even if the operating system allows it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            { id: 'system' as const, label: 'Follow system' },
            { id: 'reduce' as const, label: 'Reduce motion' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMotion(item.id)}
              className={cn(
                'rounded-lg border px-3 py-3 text-left text-sm hover:bg-accent',
                motion === item.id && 'border-primary bg-accent',
              )}
            >
              {item.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyboard</CardTitle>
          <CardDescription>
            Available on every authenticated page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">⌘K</kbd>{' '}
            command palette
          </p>
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">G</kbd> then{' '}
            <kbd className="rounded border bg-muted px-1.5 py-0.5">D</kbd>{' '}
            dashboard
          </p>
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">G</kbd> then{' '}
            <kbd className="rounded border bg-muted px-1.5 py-0.5">P</kbd>{' '}
            projects
          </p>
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">G</kbd> then{' '}
            <kbd className="rounded border bg-muted px-1.5 py-0.5">M</kbd>{' '}
            materials
          </p>
          <p>
            <kbd className="rounded border bg-muted px-1.5 py-0.5">G</kbd> then{' '}
            <kbd className="rounded border bg-muted px-1.5 py-0.5">I</kbd>{' '}
            inventory
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
