import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'TaskFlow', template: '%s · TaskFlow' },
  description: 'Plan work with your team on a shared, real-time board.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDF0F3' },
    { media: '(prefers-color-scheme: dark)', color: '#10141A' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plex.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
