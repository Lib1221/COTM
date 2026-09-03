'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CommandPalette } from '@/components/command-palette';
import { OfflineBanner } from '@/components/offline-banner';
import { SkipLink } from '@/components/skip-link';

const PUBLIC_ROUTES = ['/login'];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isPublicRoute) {
      router.replace('/login');
    } else if (user && isPublicRoute) {
      router.replace('/');
    }
  }, [user, isLoading, isPublicRoute, router]);

  useEffect(() => {
    // Close the mobile drawer after navigation. Route changes are an
    // external signal, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((value) => !value);
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === 'g') {
        const next = (second: string, href: string) => {
          const handler = (follow: KeyboardEvent) => {
            window.removeEventListener('keydown', handler);
            if (follow.key.toLowerCase() === second) {
              follow.preventDefault();
              router.push(href);
            }
          };
          window.addEventListener('keydown', handler, { once: true });
          window.setTimeout(
            () => window.removeEventListener('keydown', handler),
            800,
          );
        };
        if (!event.metaKey && !event.ctrlKey && !event.altKey) {
          next('d', '/');
          next('p', '/projects');
          next('m', '/materials');
          next('i', '/inventory');
          next('s', '/settings');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="hazard-stripe w-32 rounded-sm" />
          <p className="text-sm text-muted-foreground">
            Opening the yard desk…
          </p>
        </div>
      </div>
    );
  }

  if (isPublicRoute || !user) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <SkipLink />
      <div className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Sidebar />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <OfflineBanner />
        <Header
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setCommandOpen(true)}
        />
        <main id="main-content" className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      {commandOpen && <CommandPalette open onOpenChange={setCommandOpen} />}
    </div>
  );
}
