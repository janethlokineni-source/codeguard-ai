'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CinematicLoginIntro } from '@/components/CinematicLoginIntro';

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps = {}) {
  const router = useRouter();

  const handleComplete = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/');
    }
  };

  return <CinematicLoginIntro onComplete={handleComplete} />;
}
