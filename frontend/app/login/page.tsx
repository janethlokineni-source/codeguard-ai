'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Check, ArrowUpRight } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps = {}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
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
    <div className="h-screen w-full overflow-hidden bg-[#12091a] text-[#f6e7dc] relative select-none flex flex-col justify-between font-sans">
      {/* ========================================================================= */}
      {/* 1. ATMOSPHERIC SUNSET DUSK SKY & OCEAN BACKGROUND                         */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Sky Dusk Gradient (Plum-black top to mauve-coral horizon) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, #100618 0%, #170a22 35%, #251032 55%, #3d1a3b 68%, #6a2a46 80%, #8c3d52 87%, #a8525b 91%, #120919 92%, #0a0410 100%)',
          }}
        />

        {/* Setting Sun Warm Amber Glow at Horizon */}
        <div
          className="absolute bottom-[28%] left-[52%] -translate-x-1/2 w-[340px] h-[160px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(240, 185, 130, 0.55) 0%, rgba(201, 119, 127, 0.25) 45%, transparent 75%)',
            filter: 'blur(16px)',
          }}
        />

        {/* Ocean Surface (Dark calm sea with subtle horizon waterline) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[29%] pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #0d0614 0%, #09030e 100%)',
            borderTop: '1px solid rgba(201, 119, 127, 0.12)',
          }}
        >
          {/* Subtle water specular reflection lines */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_60%_20%_at_50%_0%,rgba(240,185,130,0.35)_0%,transparent_80%)]" />
        </div>

        {/* Sky Stars */}
        <div className="clyro-stars opacity-60" />
      </div>

      {/* ========================================================================= */}
      {/* 2. THE LIGHTHOUSE & ROTATING VOLUMETRIC BEAMS (CENTER-LEFT)               */}
      {/* ========================================================================= */}
      <div className="absolute left-[18%] sm:left-[22%] md:left-[27%] bottom-[12%] -translate-x-1/2 w-[320px] sm:w-[380px] h-[640px] pointer-events-none z-10 flex flex-col items-center justify-end">
        {/* Sweeping Volumetric Light Beams from the Lantern Room */}
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 w-[1400px] h-[180px] pointer-events-none overflow-visible flex items-center justify-center">
          {/* Left sweeping beam cone */}
          <div
            className="clyro-beam-left absolute right-1/2 origin-right"
            style={{
              width: '650px',
              height: '110px',
              background:
                'linear-gradient(to left, rgba(255, 245, 220, 0.42) 0%, rgba(255, 230, 175, 0.18) 40%, transparent 100%)',
              clipPath: 'polygon(100% 45%, 100% 55%, 0% 100%, 0% 0%)',
              filter: 'blur(2px)',
            }}
          />

          {/* Right sweeping beam cone */}
          <div
            className="clyro-beam-right absolute left-1/2 origin-left"
            style={{
              width: '650px',
              height: '110px',
              background:
                'linear-gradient(to right, rgba(255, 245, 220, 0.42) 0%, rgba(255, 230, 175, 0.18) 40%, transparent 100%)',
              clipPath: 'polygon(0% 45%, 0% 55%, 100% 100%, 100% 0%)',
              filter: 'blur(2px)',
            }}
          />
        </div>

        {/* Detailed Vector Artwork Lighthouse */}
        <svg
          viewBox="0 0 200 520"
          className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tower Body Cylindrical Gradient */}
            <linearGradient id="towerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#807a8c" />
              <stop offset="28%" stopColor="#d8d3df" />
              <stop offset="65%" stopColor="#ded9e5" />
              <stop offset="100%" stopColor="#4e4858" />
            </linearGradient>

            {/* Crimson Masonry Stripes */}
            <linearGradient id="stripeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#581d2f" />
              <stop offset="35%" stopColor="#92364c" />
              <stop offset="70%" stopColor="#92364c" />
              <stop offset="100%" stopColor="#3d121f" />
            </linearGradient>

            {/* Roof Dome Gradient */}
            <linearGradient id="domeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2c2838" />
              <stop offset="50%" stopColor="#4e485e" />
              <stop offset="100%" stopColor="#1f1c29" />
            </linearGradient>

            {/* Window Glow Filter */}
            <filter id="lanternGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Finial Needle Spire on top */}
          <line x1="100" y1="20" x2="100" y2="48" stroke="#f0c98a" strokeWidth="2.5" strokeLinecap="round" />

          {/* 2. Cap Dome */}
          <path d="M72 65 Q 100 42 128 65 Z" fill="url(#domeGradient)" stroke="#221e2c" strokeWidth="1.5" />
          <rect x="68" y="65" width="64" height="4" rx="2" fill="#2c2838" />

          {/* 3. Lantern Room (Glass with glowing lantern lamp inside) */}
          <rect x="74" y="69" width="52" height="26" fill="#150f1f" />
          {/* Intense Lantern Lamp Glow */}
          <rect
            x="76"
            y="71"
            width="48"
            height="22"
            fill="#fff3d0"
            filter="url(#lanternGlow)"
          />
          {/* Lantern Vertical Metal Struts */}
          <line x1="86" y1="69" x2="86" y2="95" stroke="#221e2c" strokeWidth="2" />
          <line x1="100" y1="69" x2="100" y2="95" stroke="#221e2c" strokeWidth="2.5" />
          <line x1="114" y1="69" x2="114" y2="95" stroke="#221e2c" strokeWidth="2" />

          {/* 4. Gallery Walkway & Railing */}
          <rect x="62" y="95" width="76" height="6" fill="#2d283a" stroke="#1f1b28" strokeWidth="1" />
          {/* Railing posts */}
          <line x1="65" y1="84" x2="135" y2="84" stroke="#4a4258" strokeWidth="1.8" />
          <line x1="68" y1="84" x2="68" y2="95" stroke="#4a4258" strokeWidth="1.2" />
          <line x1="80" y1="84" x2="80" y2="95" stroke="#4a4258" strokeWidth="1.2" />
          <line x1="92" y1="84" x2="92" y2="95" stroke="#4a4258" strokeWidth="1.2" />
          <line x1="108" y1="84" x2="108" y2="95" stroke="#4a4258" strokeWidth="1.2" />
          <line x1="120" y1="84" x2="120" y2="95" stroke="#4a4258" strokeWidth="1.2" />
          <line x1="132" y1="84" x2="132" y2="95" stroke="#4a4258" strokeWidth="1.2" />

          {/* 5. Tapered Tower Body */}
          {/* Main Tower Wall */}
          <polygon points="76,101 124,101 138,440 62,440" fill="url(#towerGradient)" />

          {/* Top Crimson Masonry Band */}
          <polygon points="79,200 121,200 123,222 77,222" fill="url(#stripeGradient)" />

          {/* Bottom Crimson Masonry Band */}
          <polygon points="73,340 127,340 130,362 70,362" fill="url(#stripeGradient)" />

          {/* Masonry horizontal line details */}
          <line x1="77" y1="140" x2="123" y2="140" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <line x1="75" y1="270" x2="125" y2="270" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <line x1="71" y1="390" x2="129" y2="390" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

          {/* Glowing Windows on Tower */}
          <rect x="82" y="160" width="8" height="15" rx="1.5" fill="#fde68a" filter="url(#lanternGlow)" />
          <rect x="110" y="245" width="8" height="15" rx="1.5" fill="#fde68a" filter="url(#lanternGlow)" />
          <rect x="83" y="295" width="8" height="15" rx="1.5" fill="#fde68a" filter="url(#lanternGlow)" />
          <rect x="82" y="380" width="8" height="15" rx="1.5" fill="#fde68a" filter="url(#lanternGlow)" />

          {/* 6. Arched Doorway at Tower Base */}
          <path d="M90 440 L90 405 Q100 392 110 405 L110 440 Z" fill="#0d0714" />
          <path d="M92 440 L92 407 Q100 395 108 407 L108 440 Z" fill="#140b1e" />

          {/* Steps leading down from door */}
          <rect x="99" y="440" width="22" height="3" fill="#30273a" />
          <rect x="101" y="443" width="23" height="3" fill="#282031" />
          <rect x="103" y="446" width="24" height="3" fill="#201a27" />

          {/* 7. Rocky Foundation Rocks */}
          <polygon points="40,480 55,455 75,465 95,448 115,460 140,450 160,475 145,490 55,490" fill="#181023" />
          <polygon points="45,482 60,460 78,470 98,452 118,464 138,455 155,478" stroke="#2a1d3b" strokeWidth="1.5" fill="none" />
          <polygon points="65,475 80,460 92,472 105,458 122,468 135,460" stroke="#332447" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOP NAVIGATION BAR (LOGO & PRIVATE SESSION CHIP)                       */}
      {/* ========================================================================= */}
      <header className="relative z-30 max-w-7xl w-full mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        {/* Top-Left CLYRO Brand Artwork */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
          {/* Logo Mark: Glowing Crescent Blade & 4-Point Star */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-105 border border-[rgba(201,119,127,0.35)] shadow-[0_0_15px_rgba(201,119,127,0.3)] bg-[#0f0816]">
            <svg className="w-4 h-4 text-[#f6e7dc]" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c9777f" />
                  <stop offset="50%" stopColor="#a26db0" />
                  <stop offset="100%" stopColor="#8a63b5" />
                </linearGradient>
              </defs>
              <path
                d="M19 12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12C5 8.134 8.134 5 12 5C13.2 5 14.32 5.3 15.3 5.84C13.28 6.94 11.9 9.12 11.9 11.62C11.9 14.65 14.35 17.1 17.38 17.1C18.15 17.1 18.88 16.94 19.55 16.66C19.2 13.9 19 12 19 12Z"
                fill="url(#logoGrad)"
              />
              <polygon
                points="14.5,8 15.2,10.2 17.4,10.9 15.2,11.6 14.5,13.8 13.8,11.6 11.6,10.9 13.8,10.2"
                fill="#f0c98a"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-sans font-extrabold tracking-[0.2em] text-[#f6e7dc] text-sm leading-none">
              CLYRO
            </span>
            <span className="text-[8px] tracking-[0.25em] uppercase font-semibold text-[#b8a5b8] mt-0.5">
              PRIVATE CODE REVIEW
            </span>
          </div>
        </Link>

        {/* Top-Right PRIVATE SESSION Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-[#180e22]/80 border border-[rgba(201,119,127,0.22)] backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0c98a] shadow-[0_0_8px_#f0c98a]" />
          <span className="text-[#f6e7dc]">PRIVATE SESSION</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4. MAIN TWO-COLUMN CONTENT AREA                                           */}
      {/* ========================================================================= */}
      <main className="relative z-20 max-w-7xl w-full mx-auto px-6 sm:px-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 py-4">
        {/* LEFT COLUMN: Cinematic Display Typography over the Lighthouse Sea */}
        <div className="lg:col-span-6 flex flex-col justify-center max-w-lg">
          {/* Subtle Accent Line & Label */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-[#c9777f]" />
            <span className="text-[10px] uppercase font-mono tracking-[0.28em] font-bold text-[#f0c98a]">
              A CLEARER VIEW BEFORE THE MERGE
            </span>
          </div>

          {/* Big Serif Cream Headline */}
          <h1 className="font-serif-heading text-4xl sm:text-5xl xl:text-6xl font-bold text-[#f6e7dc] leading-[1.08] tracking-tight mb-5 drop-shadow-md">
            See what’s<br />
            hiding<br />
            in the<br />
            dark.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#b8a5b8] font-normal leading-relaxed max-w-md mb-6">
            Review your project with confidence. Your code stays private, right where it belongs.
          </p>

          {/* Lock Privacy Note */}
          <div className="inline-flex items-center gap-2 text-xs text-[#f0c98a] font-medium">
            <Lock className="w-3.5 h-3.5 text-[#f0c98a]" />
            <span>Your code never leaves your machine</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Pixel-Perfect Sign-in Glass Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-[28px] p-6 sm:p-8 bg-[#180d23]/80 backdrop-blur-2xl border border-[rgba(201,119,127,0.22)] shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            {/* Card Header with Logo Icon */}
            <div className="flex items-start gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#0e0717] border border-[rgba(201,119,127,0.3)] shadow-[0_0_15px_rgba(201,119,127,0.25)] shrink-0">
                <svg className="w-5 h-5 text-[#f6e7dc]" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12C5 8.134 8.134 5 12 5C13.2 5 14.32 5.3 15.3 5.84C13.28 6.94 11.9 9.12 11.9 11.62C11.9 14.65 14.35 17.1 17.38 17.1C18.15 17.1 18.88 16.94 19.55 16.66C19.2 13.9 19 12 19 12Z"
                    fill="url(#logoGrad)"
                  />
                  <polygon
                    points="14.5,8 15.2,10.2 17.4,10.9 15.2,11.6 14.5,13.8 13.8,11.6 11.6,10.9 13.8,10.2"
                    fill="#f0c98a"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-serif-heading text-xl sm:text-2xl font-bold text-[#f6e7dc] leading-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-[#b8a5b8] mt-0.5">
                  Sign in to your private workspace
                </p>
              </div>
            </div>

            {/* Segmented Tab Switcher (Sign in / Create account) */}
            <div className="bg-[#0e0717] p-1 rounded-2xl border border-[rgba(201,119,127,0.18)] flex items-center mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-[rgba(58,35,76,0.95)] text-[#f6e7dc] border border-[rgba(201,119,127,0.35)] shadow-sm'
                    : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[rgba(58,35,76,0.95)] text-[#f6e7dc] border border-[rgba(201,119,127,0.35)] shadow-sm'
                    : 'text-[#b8a5b8] hover:text-[#f6e7dc]'
                }`}
              >
                Create account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Address Field */}
              <div>
                <label className="block text-[11px] font-medium text-[#b8a5b8] mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0e0717] border border-[rgba(201,119,127,0.22)] focus:border-[#c9777f] focus:ring-1 focus:ring-[#c9777f]/40 text-[#f6e7dc] placeholder:text-[#655268] text-xs transition-all outline-none"
                />
              </div>

              {/* Password Field with Show/Hide Toggle */}
              <div>
                <label className="block text-[11px] font-medium text-[#b8a5b8] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full h-10 px-3.5 pr-14 rounded-xl bg-[#0e0717] border border-[rgba(201,119,127,0.22)] focus:border-[#c9777f] focus:ring-1 focus:ring-[#c9777f]/40 text-[#f6e7dc] placeholder:text-[#655268] text-xs transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#b8a5b8] hover:text-[#f6e7dc] transition-colors cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Link */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-[#c9777f] border-[#c9777f] text-white shadow-[0_0_8px_rgba(201,119,127,0.4)]'
                        : 'border-[rgba(201,119,127,0.3)] bg-[#0e0717]'
                    }`}
                  >
                    {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-[#b8a5b8]">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleAuthSuccess}
                  className="text-[11px] text-[#f0c98a] hover:text-[#f6e7dc] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Sign In Button (Coral-rose to violet gradient) */}
              <button
                type="submit"
                disabled={isLoading}
                className="clyro-btn-primary w-full h-11 rounded-2xl text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(201,119,127,0.4)] disabled:opacity-60"
              >
                <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
                {!isLoading && <ArrowUpRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(201,119,127,0.18)]" />
              </div>
              <span className="relative px-3 bg-[#180d23] text-[9px] font-mono tracking-[0.2em] uppercase font-bold text-[#7e6980]">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Social Buttons (Google & GitHub) */}
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <button
                type="button"
                onClick={handleAuthSuccess}
                className="h-10 rounded-xl bg-[#0e0717] hover:bg-[#1b1026] border border-[rgba(201,119,127,0.22)] text-xs font-medium text-[#f6e7dc] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleAuthSuccess}
                className="h-10 rounded-xl bg-[#0e0717] hover:bg-[#1b1026] border border-[rgba(201,119,127,0.22)] text-xs font-medium text-[#f6e7dc] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-[#f6e7dc] fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Email me a sign-in link */}
            <button
              type="button"
              onClick={handleAuthSuccess}
              className="w-full h-9 rounded-xl bg-[#0e0717] hover:bg-[#1b1026] border border-[rgba(201,119,127,0.22)] text-[11px] font-medium text-[#f6e7dc] flex items-center justify-center transition-all cursor-pointer mb-3"
            >
              Email me a sign-in link
            </button>

            {/* Continue as guest (demo mode) */}
            <div className="flex items-center justify-center gap-2 mb-2 text-[11px] cursor-pointer" onClick={handleAuthSuccess}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0c98a]" />
              <span className="text-[#b8a5b8] hover:text-[#f6e7dc] transition-colors">
                Continue as guest <span className="text-[#7e6980]">(demo mode)</span>
              </span>
            </div>

            {/* Privacy Footer inside Card */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7e6980]">
              <Lock className="w-3 h-3 text-[#7e6980]" />
              <span>Private by design · Local-first code review</span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. BOTTOM FOOTER                                                          */}
      {/* ========================================================================= */}
      <footer className="relative z-30 max-w-7xl w-full mx-auto px-6 sm:px-10 pb-5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-mono text-[#7e6980]">
        <span>CLYRO · PRIVATE CODE REVIEW</span>
        <button
          type="button"
          onClick={handleAuthSuccess}
          className="hover:text-[#f6e7dc] transition-colors cursor-pointer"
        >
          Skip intro ⏭
        </button>
      </footer>
    </div>
  );
}
