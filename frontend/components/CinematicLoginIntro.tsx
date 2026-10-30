'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Shield,
  FastForward,
} from 'lucide-react';
import { StatusChip } from '@/components/ui/StatusChip';

// Dynamically import the 3D Canvas
const CinematicLighthouseCanvas = dynamic(
  () =>
    import('@/components/CinematicLighthouseCanvas').then(
      (mod) => mod.CinematicLighthouseCanvas
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

interface CinematicLoginIntroProps {
  onComplete: () => void;
}

export const CinematicLoginIntro: React.FC<CinematicLoginIntroProps> = ({
  onComplete,
}) => {
  // Stages:
  // 1. 'logo_reveal': Pure darkness -> Logo brightness ramps up from 0 to 130%
  // 2. 'blackout': Screen fades back into complete blackness
  // 3. 'lighthouse_drop': Sunset sky awakens, 3D lighthouse drops from the sky to the left corner
  // 4. 'beacon_sweep': Beacon ignites, sweeps 360° around
  // 5. 'login_popup': Light stops at right side, Login Pop-up opens under the spotlight!
  const [stage, setStage] = useState<
    'logo_reveal' | 'blackout' | 'lighthouse_drop' | 'beacon_sweep' | 'login_popup'
  >('logo_reveal');

  const [logoBrightness, setLogoBrightness] = useState<number>(0);
  const [logoOpacity, setLogoOpacity] = useState<number>(0);

  // Authentication form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Scripted Timeline Execution
  useEffect(() => {
    // Stage 1: Brightness of logo ramps from 0 to 130%
    const timer1 = setTimeout(() => {
      setLogoOpacity(1);
      setLogoBrightness(1.3);
    }, 150);

    // Stage 2: Fade back to pure blackness
    const timer2 = setTimeout(() => {
      setStage('blackout');
    }, 2200);

    // Stage 3: Sunset world awakens & Lighthouse drops down
    const timer3 = setTimeout(() => {
      setStage('lighthouse_drop');
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // When lighthouse lands, begin the 360° beacon sweep
  const handleLighthouseLanded = () => {
    setStage('beacon_sweep');
  };

  // When beam finishes 360° rotation and stops at the right, reveal the login pop-up!
  const handleBeamLockedAtRight = () => {
    setStage('login_popup');
  };

  // Skip directly to the login pop-up
  const handleSkipToLogin = () => {
    setStage('login_popup');
  };

  // Upon authentication, smooth exit and open website
  const handleAuthComplete = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clyro_auth', 'true');
    }
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden select-none bg-[#0a0312] text-[#f6e7dc] transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. 3D LIGHTHOUSE CANVAS (DROPS DOWN, ROTATES 360°, STOPS AT RIGHT)        */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0">
        <CinematicLighthouseCanvas
          stage={stage}
          onLighthouseLanded={handleLighthouseLanded}
          onBeamLockedAtRight={handleBeamLockedAtRight}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. STAGE 1: COMPLETE DARKNESS & LOGO BRIGHTNESS REVEAL                    */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-black transition-opacity duration-700 pointer-events-none ${
          stage === 'logo_reveal'
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      >
        <div
          className="flex flex-col items-center justify-center text-center transition-all duration-1000 transform"
          style={{
            opacity: logoOpacity,
            filter: `brightness(${logoBrightness}) drop-shadow(0 0 35px rgba(201, 119, 127, ${
              logoBrightness * 0.7
            }))`,
            transform: `scale(${logoOpacity > 0 ? 1 : 0.94})`,
          }}
        >
          {/* 3D Chrome Emblem */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border border-[rgba(201,119,127,0.45)] bg-[#0d0516] flex items-center justify-center p-3 shadow-[0_0_50px_rgba(201,119,127,0.5)] overflow-hidden mb-6">
            <img
              src="/clyro-icon.png"
              alt="CLYRO Emblem"
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(201,119,127,0.8)]"
            />
          </div>

          <h1 className="font-serif-heading text-4xl sm:text-5xl font-extrabold tracking-[0.25em] text-[#ffffff] uppercase leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            CLYRO
          </h1>

          <p className="text-xs sm:text-sm font-sans tracking-[0.3em] font-semibold text-[#f0c98a] uppercase mt-3 drop-shadow-md">
            Private Code Review
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. STAGE 2: PURE BLACKOUT TRANSITION                                      */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 z-10 bg-black pointer-events-none transition-opacity duration-500 ${
          stage === 'blackout' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ========================================================================= */}
      {/* 4. LEFT BRAND OVERLAY (ACTIVE ONCE SUNSET AWAKENS)                        */}
      {/* ========================================================================= */}
      <div
        className={`absolute top-8 left-8 sm:top-10 sm:left-12 z-10 pointer-events-none transition-opacity duration-1000 ${
          stage === 'lighthouse_drop' || stage === 'beacon_sweep' || stage === 'login_popup'
            ? 'opacity-100'
            : 'opacity-0'
        }`}
      >
        <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-[#f0c98a] block drop-shadow-sm">
          A Clearer View Before The Merge
        </span>
        <h2 className="font-serif-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ffffff] mt-2 leading-[1.15] tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] max-w-md">
          See what&apos;s hiding in the dark.
        </h2>
      </div>

      {/* ========================================================================= */}
      {/* 5. TOP RIGHT QUICK ACCESS CONTROLS                                        */}
      {/* ========================================================================= */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-30 flex items-center gap-3">
        {stage !== 'login_popup' && (
          <button
            type="button"
            onClick={handleSkipToLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12081d]/80 hover:bg-[#201032] border border-[rgba(201,119,127,0.35)] text-xs text-[#d8c8de] hover:text-[#ffffff] transition-all cursor-pointer shadow-lg backdrop-blur-md"
            title="Skip directly to login pop-up"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3.5 h-3.5 text-[#f0c98a]" />
          </button>
        )}

        <StatusChip label="PRIVATE SESSION" />
      </div>

      {/* ========================================================================= */}
      {/* 6. STAGE 5: LOGIN POP-UP OPENS UNDER THE SPOTLIGHT AT THE RIGHT SIDE     */}
      {/* ========================================================================= */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-end p-4 sm:p-8 lg:pr-16 pointer-events-none transition-all duration-700 ${
          stage === 'login_popup'
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        {/* The Login Pop-Up Card */}
        <div className="w-full max-w-[430px] rounded-3xl bg-[#14081e]/92 border border-[rgba(201,119,127,0.45)] backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(201,119,127,0.35)] p-6 sm:p-8 pointer-events-auto relative overflow-hidden">
          {/* Top Ambient Highlight Rim */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(240, 201, 138, 0.35) 0%, rgba(201, 119, 127, 0.2) 50%, transparent 80%)',
              filter: 'blur(16px)',
            }}
          />

          {/* Card Header & Brand */}
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl border border-[rgba(201,119,127,0.4)] bg-[#100618] flex items-center justify-center shadow-[0_0_12px_rgba(201,119,127,0.3)]">
                <svg
                  className="w-4 h-4 text-[#f6e7dc]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="popClyroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d46d78" />
                      <stop offset="50%" stopColor="#b369b8" />
                      <stop offset="100%" stopColor="#8a63b5" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M19 12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12C5 8.134 8.134 5 12 5C13.2 5 14.32 5.3 15.3 5.84C13.28 6.94 11.9 9.12 11.9 11.62C11.9 14.65 14.35 17.1 17.38 17.1C18.15 17.1 18.88 16.94 19.55 16.66C19.2 13.9 19 12 19 12Z"
                    fill="url(#popClyroGrad)"
                  />
                  <path
                    d="M17.5 7.5L18.2 9.8L20.5 10.5L18.2 11.2L17.5 13.5L16.8 11.2L14.5 10.5L16.8 9.8L17.5 7.5Z"
                    fill="#f0c98a"
                  />
                </svg>
              </div>
              <span className="font-serif-heading font-black tracking-tight text-lg text-white">
                CLYRO
              </span>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#f0c98a] bg-[#1d0e2b] px-2.5 py-1 rounded-full border border-[rgba(201,119,127,0.3)]">
              Local First
            </span>
          </div>

          {/* Heading */}
          <div className="mb-5 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#f0c98a] block mb-1">
              SECURE WORKSPACE
            </span>
            <h3 className="font-serif-heading text-2xl font-bold text-[#ffffff] tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h3>
            <p className="text-xs text-[#ddd0e3] mt-1 leading-relaxed">
              {isSignUp
                ? 'Create credentials to inspect code and security locally.'
                : 'Sign in to access your private code review workspace.'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="mb-5 p-1 bg-[#0d0414] rounded-xl border border-[rgba(201,119,127,0.3)] grid grid-cols-2 gap-1 relative z-10">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-[#351944] text-[#ffffff] border border-[#c9777f]/70 shadow-[0_0_12px_rgba(201,119,127,0.35)]'
                  : 'text-[#d0c0d6] hover:text-[#ffffff]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-[#351944] text-[#ffffff] border border-[#c9777f]/70 shadow-[0_0_12px_rgba(201,119,127,0.35)]'
                  : 'text-[#d0c0d6] hover:text-[#ffffff]'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthComplete} className="space-y-3.5 relative z-10">
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
                className="w-full h-10 px-3.5 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.45)] text-white text-xs placeholder-[#9f8ca8] focus:border-[#f0c98a] focus:ring-1 focus:ring-[#f0c98a] focus:outline-none transition-all shadow-inner"
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
                  className="w-full h-10 px-3.5 pr-10 rounded-xl bg-[#0d0414] border border-[rgba(201,119,127,0.45)] text-white text-xs placeholder-[#9f8ca8] focus:border-[#f0c98a] focus:ring-1 focus:ring-[#f0c98a] focus:outline-none transition-all shadow-inner"
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
            <div className="flex items-center justify-between pt-0.5">
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
                      : 'border-[rgba(201,119,127,0.45)] bg-[#0d0414]'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs text-[#f6e7dc] font-medium">Remember me</span>
              </label>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleAuthComplete}
                  className="text-xs font-semibold text-[#f0c98a] hover:text-[#fff2d6] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="clyro-btn-primary w-full h-11 rounded-xl text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_22px_rgba(201,119,127,0.45)] hover:shadow-[0_0_32px_rgba(201,119,127,0.65)] hover:brightness-110 active:scale-[0.99] disabled:opacity-60 mt-1"
            >
              <span>
                {isSubmitting
                  ? 'Entering Workspace...'
                  : isSignUp
                  ? 'Create Workspace'
                  : 'Sign In & Enter'}
              </span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(201,119,127,0.3)]" />
            </div>
            <span className="relative px-3 bg-[#14081e] text-[9px] font-mono tracking-[0.22em] uppercase font-bold text-[#bcaac4]">
              OR CONTINUE WITH
            </span>
          </div>

          {/* GitHub & Quick Guest Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleAuthComplete()}
              className="h-10 rounded-xl bg-[#0d0414] hover:bg-[#1d0e2b] border border-[rgba(201,119,127,0.38)] hover:border-[#c9777f] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-[#f0c98a] fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </button>

            <button
              type="button"
              onClick={() => handleAuthComplete()}
              className="h-10 rounded-xl bg-[#0d0414] hover:bg-[#1d0e2b] border border-[rgba(201,119,127,0.38)] hover:border-[#f0c98a] text-xs font-semibold text-[#f6e7dc] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Enter workspace as local guest"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f0c98a]" />
              <span>Guest Enter</span>
            </button>
          </div>

          {/* Footer Lock Security Note */}
          <div className="w-full text-center pt-4">
            <div className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-mono font-semibold text-[#bcaac4]">
              <Lock className="w-3 h-3 text-[#f0c98a]" />
              <span>CLYRO · RUNS 100% LOCALLY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
