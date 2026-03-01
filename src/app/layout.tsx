import type { Metadata } from 'next';
import { DM_Serif_Display, Manrope } from 'next/font/google';
import './globals.css';

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const manrope = Manrope({
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
    <html lang="zh-CN" className={`${dmSerif.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
