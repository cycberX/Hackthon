import './globals.css';
import type { Metadata } from 'next';
import ThemeProvider from '../app/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'OneAPI — Enterprise Multi-Provider Proxy Gateway',
  description:
    'Abstract and unify third-party providers with automatic failover.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
