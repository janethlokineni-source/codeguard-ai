'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const registerSW = () => {
        const isGh = window.location.pathname.startsWith('/codeguard-ai');
        const swPath = isGh ? '/codeguard-ai/sw.js' : '/sw.js';
        navigator.serviceWorker
          .register(swPath)
          .then((registration) => {
            console.log('[CLYRO] Service worker registered with scope:', registration.scope);
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[CLYRO] New version available offline.');
                    }
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[CLYRO] Service worker registration ignored:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
