import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Notion Blog',
  description: 'Notion Blog',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* min-h-screen으로 전체 높이 보장 */}
        <div className="flex min-h-screen flex-col">
          {/* Header 영역 */}
          <Header />
          <main className="flex-1">{children}</main>
          {/* Footer 영역 */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
