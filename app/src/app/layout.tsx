import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { AppProvider } from '@/contexts/AppContext';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

export const metadata: Metadata = {
  title: 'BOTS Trading Card Creator',
  description: 'Create your personalized BOTS trading card',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} antialiased`}>
        <ErrorBoundary>
          <GlobalErrorHandler>
            <AppProvider>{children}</AppProvider>
          </GlobalErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}
