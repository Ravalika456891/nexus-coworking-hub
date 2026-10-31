import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'NEXUS HUB – Meeting Rooms Booking',
  description: 'Premium Coworking & Meeting Rooms Management Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#F6F7FB] text-[#374151] antialiased`}>
        {children}
      </body>
    </html>
  );
}

