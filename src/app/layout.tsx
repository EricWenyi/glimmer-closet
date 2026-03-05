import type { Metadata } from 'next';
import { Playfair_Display, Quicksand } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Glimmer Closet',
  description: 'Smart wardrobe management with photo upload, tagging, and filtering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${playfair.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
