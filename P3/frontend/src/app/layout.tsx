import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Screend - Track Your TV Shows',
  description: 'Track, rate, and review TV shows and episodes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-bg text-dark-text min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
