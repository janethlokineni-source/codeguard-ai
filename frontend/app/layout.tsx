import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CLYRO · Private Code Review',
  description: 'Private code review before the merge. Detects bugs, syntax errors, security vulnerabilities, and outdated dependencies with instant automated solutions.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#120b1a] text-[#f6e7dc] antialiased min-h-screen selection:bg-[#c9777f]/40 selection:text-[#f6e7dc]">
        {children}
      </body>
    </html>
  );
}
