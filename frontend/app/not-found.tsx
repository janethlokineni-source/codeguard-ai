'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { PageBackground } from '@/components/ui/PageBackground';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <PageBackground className="justify-between p-8">
      <header className="max-w-6xl w-full mx-auto">
        <Logo size="md" />
      </header>

      <main className="max-w-md w-full mx-auto my-auto text-center py-12">
        <Card className="p-8 flex flex-col items-center shadow-2xl">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(201,119,127,0.15)] border border-[rgba(201,119,127,0.3)] mb-4 text-[#f0c98a]">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>

          <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#f0c98a] block mb-1">
            404 · OFF THE MAP
          </span>

          <h1 className="font-serif-heading text-2xl font-bold text-[#f6e7dc] mb-2">
            Lost in the dark waters.
          </h1>

          <p className="text-xs text-[#b8a5b8] mb-6 leading-relaxed">
            The page you are looking for does not exist or has been relocated to private waters.
          </p>

          <Link href="/">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Workspace
            </Button>
          </Link>
        </Card>
      </main>

      <footer className="max-w-6xl w-full mx-auto text-center text-[10px] uppercase tracking-widest text-[#7e6980]">
        CLYRO · PRIVATE CODE REVIEW
      </footer>
    </PageBackground>
  );
}
