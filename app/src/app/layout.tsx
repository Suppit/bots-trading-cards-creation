import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';

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
      <body className="antialiased">
        <ErrorBoundary>
          <GlobalErrorHandler>{children}</GlobalErrorHandler>
        </ErrorBoundary>
      </body>
    </html>
  );
}
