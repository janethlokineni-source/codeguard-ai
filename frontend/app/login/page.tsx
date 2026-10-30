'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Lock,
  Mail,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { PageBackground } from '@/components/ui/PageBackground';
import { StatusChip } from '@/components/ui/StatusChip';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 700);
  };

  return (
    <PageBackground className="justify-between px-6 py-8">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Logo size="md" />
        <StatusChip label="PRIVATE SESSION" />
      </header>

      {/* Center Auth Experience */}
      <main className="max-w-md w-full mx-auto my-auto py-10 flex flex-col items-center">
        {/* Cinematic Serif Heading */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#f0c98a] block mb-2">
            A CLEARER VIEW BEFORE THE MERGE
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-bold text-[#f6e7dc] leading-tight tracking-tight">
            See what&apos;s hiding in the dark.
          </h1>
          <p className="text-xs text-[#b8a5b8] mt-2 max-w-xs mx-auto">
            Offline, privacy-first automated code security inspection and bug remediation.
          </p>
        </div>

        {/* Translucent Dusk Glass Card */}
        <Card className="w-full p-7 sm:p-8 shadow-2xl">
          {/* Segmented Tab Control */}
          <div className="bg-[#0f0816] p-1 rounded-2xl border border-[rgba(201,119,127,0.18)] flex items-center mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-[rgba(54,33,72,0.95)] text-[#f6e7dc] border border-[rgba(201,119,127,0.35)] shadow-sm'
                  : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[rgba(54,33,72,0.95)] text-[#f6e7dc] border border-[rgba(201,119,127,0.35)] shadow-sm'
                  : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work or Personal Email"
              type="email"
              placeholder="engineer@team.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPasswordToggle
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#b8a5b8] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[rgba(201,119,127,0.3)] bg-[#0f0816] text-[#c9777f] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="text-[#f0c98a] hover:underline cursor-pointer font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Gradient Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              disabled={isLoading}
            >
              {isLoading
                ? 'Opening workspace...'
                : activeTab === 'signin'
                ? 'Enter Workspace'
                : 'Create Account'}
            </Button>
          </form>

          <Divider label="OR CONTINUE WITH" />

          {/* Social Auth Outlined Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[rgba(35,23,48,0.65)] hover:bg-[rgba(50,32,68,0.85)] border border-[rgba(201,119,127,0.22)] text-xs font-medium text-[#f6e7dc] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#f0c98a] fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[rgba(35,23,48,0.65)] hover:bg-[rgba(50,32,68,0.85)] border border-[rgba(201,119,127,0.22)] text-xs font-medium text-[#f6e7dc] transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#c9777f]" />
              <span>Magic Link</span>
            </button>
          </div>
        </Card>
      </main>

      {/* Footer Lock Note */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-6 pb-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7e6980]">
          <Lock className="w-3 h-3 text-[#f0c98a]" />
          <span>CLYRO · PRIVATE CODE REVIEW · RUNS 100% LOCALLY</span>
        </div>
      </footer>
    </PageBackground>
  );
}
