import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OneAPI — Enterprise Multi-Provider Proxy Gateway',
  description: 'Abstract and unify third-party providers with automatic failover.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
