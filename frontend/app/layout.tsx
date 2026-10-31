import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const basePath = process.env.GITHUB_PAGES === 'true' ? '/codeguard-ai' : '';

export const metadata: Metadata = {
  title: 'CLYRO · Private Code Review',
  description: 'Private code review before the merge. Detects bugs, syntax errors, security vulnerabilities, and outdated dependencies with instant automated solutions.',
  icons: {
    icon: `${basePath}/favicon.ico`,
  },
  manifest: `${basePath}/manifest.json`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#120b1a] text-[#f6e7dc] antialiased min-h-screen selection:bg-[#c9777f]/40 selection:text-[#f6e7dc]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
