'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Wand2, Shield, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { PageBackground } from '@/components/ui/PageBackground';
import { Logo } from '@/components/ui/Logo';
import { StatusChip } from '@/components/ui/StatusChip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Divider } from '@/components/ui/Divider';

export default function DesignSystemPage() {
  return (
    <PageBackground className="p-8">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[rgba(201,119,127,0.2)]">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[rgba(35,23,48,0.7)] text-[#b8a5b8] hover:text-[#f6e7dc] border border-[rgba(201,119,127,0.2)]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <Logo size="lg" />
              <p className="text-xs text-[#b8a5b8] mt-1">Design System & Token Catalog</p>
            </div>
          </div>
          <StatusChip label="DESIGN TOKENS" />
        </div>

        {/* 1. Palette */}
        <section className="space-y-4">
          <h2 className="font-serif-heading text-xl text-[#f6e7dc]">1. Core Dusk Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[
              { name: 'Plum Black (Base)', value: '#120b1a', text: '#f6e7dc' },
              { name: 'Plum Secondary', value: '#190f24', text: '#f6e7dc' },
              { name: 'Glass Card', value: 'rgba(26, 17, 37, 0.76)', text: '#f6e7dc' },
              { name: 'Warm Cream Text', value: '#f6e7dc', text: '#120b1a' },
              { name: 'Mauve Body Text', value: '#b8a5b8', text: '#120b1a' },
              { name: 'Accent Gold', value: '#f0c98a', text: '#120b1a' },
              { name: 'Coral Rose', value: '#c9777f', text: '#f6e7dc' },
              { name: 'Violet End', value: '#8a63b5', text: '#f6e7dc' },
            ].map((c) => (
              <div
                key={c.name}
                className="p-3 rounded-2xl border border-[rgba(201,119,127,0.22)] flex flex-col justify-between h-24"
                style={{ background: c.value, color: c.text }}
              >
                <span className="text-[11px] font-semibold">{c.name}</span>
                <span className="text-[10px] font-mono opacity-80">{c.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Harmonized Severity Badges */}
        <section className="space-y-4">
          <h2 className="font-serif-heading text-xl text-[#f6e7dc]">2. Harmonized Severity Badges</h2>
          <Card className="p-6 flex flex-wrap items-center gap-3">
            <Badge severity="Critical">Critical Issue</Badge>
            <Badge severity="High">High Severity</Badge>
            <Badge severity="Medium">Medium Warning</Badge>
            <Badge severity="Low">Low / Note</Badge>
            <Badge severity="Safe">Safe / Passing</Badge>
          </Card>
        </section>

        {/* 3. Buttons */}
        <section className="space-y-4">
          <h2 className="font-serif-heading text-xl text-[#f6e7dc]">3. Button Variants</h2>
          <Card className="p-6 flex flex-wrap items-center gap-4">
            <Button variant="primary" icon={<Wand2 className="w-3.5 h-3.5" />}>
              Primary Gradient
            </Button>
            <Button variant="secondary">Secondary Glass</Button>
            <Button variant="ghost">Ghost Option</Button>
            <Button variant="danger">Destructive Action</Button>
            <Button variant="primary" disabled>
              Disabled State
            </Button>
          </Card>
        </section>

        {/* 4. Form Controls */}
        <section className="space-y-4">
          <h2 className="font-serif-heading text-xl text-[#f6e7dc]">4. Form Inputs & Dividers</h2>
          <Card className="p-6 max-w-md space-y-4">
            <Input label="Standard Input" placeholder="Search repository..." />
            <Input
              label="Password Input with Show/Hide"
              type="password"
              placeholder="••••••••"
              showPasswordToggle
            />
            <Divider label="OR SEPARATOR" />
          </Card>
        </section>
      </div>
    </PageBackground>
  );
}
