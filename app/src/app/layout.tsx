import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { AppProvider } from '@/contexts/AppContext';

const figtree = localFont({
  src: [
    { path: '../../public/fonts/Figtree-VariableFont_wght.ttf', style: 'normal', weight: '100 900' },
    { path: '../../public/fonts/Figtree-Italic-VariableFont_wght.ttf', style: 'italic', weight: '100 900' },
  ],
  variable: '--font-figtree',
  display: 'swap',
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
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
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
