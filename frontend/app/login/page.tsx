'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { StatusChip } from '@/components/ui/StatusChip';

// Dynamically import the 3D WebGL Lighthouse Scene client-side
const LighthouseScene = dynamic(
  () => import('@/components/LighthouseScene').then((mod) => mod.LighthouseScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#120b1a] text-[#f6e7dc] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#c9777f] border-t-transparent animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase text-[#f0c98a]">
          Igniting Beacon...
        </span>
      </div>
    ),
  }
);

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps = {}) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = () => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clyro_auth', 'true');
    }
    setTimeout(() => {
      setIsLoading(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthSuccess();
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#100718] text-[#f6e7dc] flex flex-col select-none relative font-sans">
      {/* Upper Subtle Horizon Glow */}
      <div
        className="absolute top-0 right-0 w-[420px] h-[420px] pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle at 100% 0%, rgba(201, 119, 127, 0.22) 0%, transparent 70%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Main Two-Column Laptop Layout (Designed for 1440x900 and 1280x720) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-full overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Spacious 3D Sunset Lighthouse Scene (7 Cols on desktop)      */}
        {/* ========================================================================= */}
        <div className="hidden lg:block lg:col-span-7 h-full relative border-r border-[rgba(201,119,127,0.25)] bg-[#120b1a] overflow-hidden">
          <LighthouseScene />
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Sign-in Panel (5 Cols on desktop) - Crisp High-Contrast     */}
        {/* ========================================================================= */}
        <div className="col-span-1 lg:col-span-5 h-full flex flex-col justify-between p-6 sm:p-8 xl:p-12 overflow-y-auto lg:overflow-hidden bg-[#150a1e]/98 backdrop-blur-2xl relative z-10 border-l border-[rgba(201,119,127,0.2)]">
          {/* Top Panel Bar */}
          <div className="flex items-center justify-between w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group cursor-pointer"
              title="Return to Home"
            >
              {/* Clean Vector CLYRO Crescent & Star Emblem */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105 border border-[rgba(201,119,127,0.45)] shadow-[0_0_18px_rgba(201,119,127,0.35)] bg-[#1a0c26]">
                <svg
                  className="w-5 h-5 text-[#f6e7dc]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="clyroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d46d78" />
                      <stop offset="50%" stopColor="#b369b8" />
                      <stop offset="100%" stopColor="#8a63b5" />
                    </linearGradient>
                  </defs>
                  {/* Outer Crescent */}
                  <path
                    d="M19 12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12C5 8.134 8.134 5 12 5C13.2 5 14.32 5.3 15.3 5.84C13.28 6.94 11.9 9.12 11.9 11.62C11.9 14.65 14.35 17.1 17.38 17.1C18.15 17.1 18.88 16.94 19.55 16.66C19.2 13.9 19 12 19 12Z"
                    fill="url(#clyroGradient)"
                  />
                  {/* 4-Pointed Star in Crescent */}
                  <path
                    d="M17.5 7.5L18.2 9.8L20.5 10.5L18.2 11.2L17.5 13.5L16.8 11.2L14.5 10.5L16.8 9.8L17.5 7.5Z"
                    fill="#f0c98a"
                  />
                </svg>
              </div>

              <div>
                <span className="font-serif-heading font-black tracking-tight text-xl text-[#ffffff] block leading-none">
                  CLYRO
                </span>
                <span className="text-[9px] uppercase tracking-[0.24em] font-semibold text-[#d4c4d9] block mt-0.5">
                  Private Code Review
                </span>
              </div>
            </Link>

            {/* Status Chip */}
            <StatusChip label="PRIVATE SESSION" />
          </div>

          {/* Center Form Section */}
          <div className="w-full max-w-sm mx-auto my-auto py-4">
            {/* Heading & Subtitle */}
            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#f0c98a] block mb-1">
                SECURE WORKSPACE
              </span>
              <h1 className="font-serif-heading text-3xl font-bold text-[#ffffff] tracking-tight">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-xs text-[#ddd0e3] mt-1.5 leading-relaxed font-normal">
                {isSignUp
                  ? 'Set up your credentials to inspect and analyze private code locally.'
                  : 'Enter your credentials to access your local code analysis workspace.'}
              </p>
            </div>

            {/* Segmented Tab Control (Sign In / Create Account) */}
            <div className="clyro-tabs-container mb-6 p-1 bg-[#100618] rounded-xl border border-[rgba(201,119,127,0.35)] grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isSignUp
                    ? 'bg-[#351944] text-[#ffffff] border border-[#c9777f]/70 shadow-[0_0_14px_rgba(201,119,127,0.35)]'
                    : 'text-[#d0c0d6] hover:text-[#ffffff]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isSignUp
                    ? 'bg-[#351944] text-[#ffffff] border border-[#c9777f]/70 shadow-[0_0_14px_rgba(201,119,127,0.35)]'
                    : 'text-[#d0c0d6] hover:text-[#ffffff]'
                }`}
              >
                Create account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-[#f6e7dc] tracking-wider uppercase mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@team.domain"
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-[#12081d] border border-[rgba(201,119,127,0.45)] text-white text-xs placeholder-[#9f8ca8] focus:border-[#f0c98a] focus:ring-1 focus:ring-[#f0c98a] focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#f6e7dc] tracking-wider uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#12081d] border border-[rgba(201,119,127,0.45)] text-white text-xs placeholder-[#9f8ca8] focus:border-[#f0c98a] focus:ring-1 focus:ring-[#f0c98a] focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4c4d9] hover:text-[#ffffff] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-[#c9777f] border-[#c9777f] text-white shadow-[0_0_8px_rgba(201,119,127,0.5)]'
                        : 'border-[rgba(201,119,127,0.45)] bg-[#12081d]'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs text-[#f6e7dc] font-medium">Remember me</span>
                </label>

                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-xs font-semibold text-[#f0c98a] hover:text-[#fff2d6] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="clyro-btn-primary w-full h-11 rounded-xl text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_22px_rgba(201,119,127,0.45)] hover:shadow-[0_0_32px_rgba(201,119,127,0.65)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Workspace' : 'Sign In'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(201,119,127,0.3)]" />
              </div>
              <span className="relative px-3 bg-[#150a1e] text-[10px] font-mono tracking-[0.22em] uppercase font-bold text-[#bcaac4]">
                OR CONTINUE WITH
              </span>
            </div>

            {/* GitHub Sign-In Button */}
            <button
              type="button"
              onClick={handleAuthSuccess}
              className="w-full h-11 rounded-xl bg-[#12081d] hover:bg-[#201030] border border-[rgba(201,119,127,0.38)] hover:border-[#c9777f] text-xs font-semibold text-[#ffffff] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 text-[#f0c98a] fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </button>

            {/* Account Switch Text */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-[#d8c8de] hover:text-[#ffffff] transition-colors cursor-pointer"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <span className="text-[#f0c98a] font-bold underline underline-offset-4">
                      Sign in
                    </span>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <span className="text-[#f0c98a] font-bold underline underline-offset-4">
                      Create one
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Lock Note */}
          <div className="w-full text-center pt-3">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-mono font-semibold text-[#c5b5cc]">
              <Lock className="w-3.5 h-3.5 text-[#f0c98a]" />
              <span>CLYRO · PRIVATE CODE REVIEW · RUNS 100% LOCALLY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
