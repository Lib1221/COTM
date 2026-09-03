'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Package,
  Palette,
  ScrollText,
  Search,
  Settings,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/use-debounce';
import { useAuth } from '@/lib/auth-context';
import { useAppearance } from '@/components/theme-provider';
import type { Material, PaginatedResponse, Project } from '@/lib/types';
import { cn } from '@/lib/utils';

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href?: string;
  action?: () => void;
  icon: typeof Search;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { can } = useAuth();
  const { cyclePalette } = useAppearance();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebouncedValue(query, 200);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const { data: projects } = useQuery({
    queryKey: ['command-projects', debounced],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '5' });
      if (debounced && debounced !== '?') params.set('search', debounced);
      return api.get<PaginatedResponse<Project>>(`/projects?${params}`);
    },
    enabled: open,
  });

  const { data: materials } = useQuery({
    queryKey: ['command-materials', debounced],
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', pageSize: '5' });
      if (debounced && debounced !== '?') params.set('search', debounced);
      return api.get<PaginatedResponse<Material>>(`/materials?${params}`);
    },
    enabled: open,
  });

  const items = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    const nav: CommandItem[] = [
      {
        id: 'dash',
        label: 'Dashboard',
        group: 'Go to',
        href: '/',
        icon: LayoutDashboard,
      },
      {
        id: 'projects',
        label: 'Projects',
        group: 'Go to',
        href: '/projects',
        icon: FolderKanban,
      },
      {
        id: 'materials',
        label: 'Materials',
        group: 'Go to',
        href: '/materials',
        icon: Package,
      },
      {
        id: 'inventory',
        label: 'Inventory',
        group: 'Go to',
        href: '/inventory',
        icon: Boxes,
      },
      {
        id: 'settings',
        label: 'Settings',
        group: 'Go to',
        href: '/settings',
        icon: Settings,
      },
    ];
    if (can('delete')) {
      nav.push({
        id: 'audit',
        label: 'Audit log',
        group: 'Go to',
        href: '/audit',
        icon: ScrollText,
      });
    }
    const actions: CommandItem[] = [
      {
        id: 'palette',
        label: 'Cycle site palette',
        group: 'Actions',
        icon: Palette,
        action: cyclePalette,
      },
    ];
    if (can('create')) {
      actions.unshift(
        {
          id: 'new-project',
          label: 'New project',
          group: 'Actions',
          href: '/projects/new',
          icon: FolderKanban,
        },
        {
          id: 'new-material',
          label: 'New material',
          group: 'Actions',
          href: '/materials/new',
          icon: Package,
        },
      );
    }

    const projectItems =
      projects?.data.map((project) => ({
        id: `p-${project.id}`,
        label: project.name,
        hint: project.code,
        group: 'Projects',
        href: `/projects/${project.id}`,
        icon: FolderKanban,
      })) ?? [];

    const materialItems =
      materials?.data.map((material) => ({
        id: `m-${material.id}`,
        label: material.name,
        hint: material.code,
        group: 'Materials',
        href: `/materials/${material.id}/edit`,
        icon: Package,
      })) ?? [];

    const all = [...nav, ...actions, ...projectItems, ...materialItems];
    if (!q || q === '?') return all;
    return all.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.hint?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [query, projects, materials, can, cyclePalette]);

  const safeActive =
    items.length === 0 ? 0 : Math.min(active, items.length - 1);

  const run = (item: CommandItem) => {
    onOpenChange(false);
    item.action?.();
    if (item.href) router.push(item.href);
  };

  if (!open) return null;

  const grouped = items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-50 w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, items.length - 1));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === 'Enter' && items[safeActive]) {
                event.preventDefault();
                run(items[safeActive]);
              }
            }}
            placeholder="Search projects, materials, pages…"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        <div className="max-h-[min(24rem,50vh)] overflow-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matches.
            </p>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  {group}
                </p>
                {groupItems.map((item) => {
                  const index = items.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm',
                        index === safeActive &&
                          'bg-accent text-accent-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.hint}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
