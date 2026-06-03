import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'HDB Design Studio',
  description: 'Design your dream HDB home with AI — select your BTO, chat with an AI consultant, and generate photorealistic renders.',
  keywords: ['HDB', 'BTO', 'interior design', 'Singapore', 'AI design'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          {children}
          <BottomNav />
          <Toaster position="top-center" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
