import type { Metadata, Viewport } from 'next';
import { Archivo, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/sonner';
import { APPEARANCE_INIT_SCRIPT } from '@/lib/appearance';

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Liben CMS',
    template: '%s · Liben CMS',
  },
  description:
    'Construction site control for projects, BOQ, materials, inventory, and progress.',
  applicationName: 'Liben CMS',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#2a241c' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-palette="hivis"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Script
          id="cms-appearance"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
