import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CODEGUARD AI — Instant Code & Security Scanner',
  description: 'Local, offline code scanner for hackathon teams. Detects bugs, syntax errors, security vulnerabilities, and outdated dependencies before merge.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
