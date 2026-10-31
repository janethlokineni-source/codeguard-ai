// CLYRO Service Worker - High-Performance Offline PWA
const CACHE_NAME = 'clyro-offline-v3';

// Dynamically resolve base path (for GitHub Pages '/codeguard-ai' vs local '')
const isGh = self.location.pathname.includes('/codeguard-ai');
const BASE = isGh ? '/codeguard-ai' : '';

const RAW_PRECACHE = [
  '',
  '/',
  '/login',
  '/admin',
  '/design-system',
  '/manifest.json',
  '/favicon.ico',
  '/clyro-icon.png',
  '/clyro-logo.jpg',
  '/clyro-mark.png',
  '/monaco/vs/loader.js',
  '/monaco/vs/editor/editor.main.js',
  '/monaco/vs/editor/editor.main.css',
  '/fonts/144353ea_u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSequJ-mFqA.woff2',
  '/fonts/1747ce64_nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTXtXA-W2r.woff2',
  '/fonts/27e1b5c3_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx3cwhsk.woff2',
  '/fonts/2ac5e2f2_nuFiD-vYSZviVYUb_rj3ij__anPXDTPYgFE_.woff2',
  '/fonts/39529051_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2',
  '/fonts/4136269b_nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2',
  '/fonts/480c0625_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2',
  '/fonts/48d1e9cd_nuFiD-vYSZviVYUb_rj3ij__anPXDTzYgA.woff2',
  '/fonts/4dbf5ead_u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUG33AvE.woff2',
  '/fonts/4e6c49e9_nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTXtHA-Q.woff2',
  '/fonts/4e811b07_u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUG36AvHqYQ.woff2',
  '/fonts/4ee8fc98_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2',
  '/fonts/50c55c63_u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSeqlJ-mFqA.woff2',
  '/fonts/53a6c326_8vIJ7ww63mVu7gt7-GT7LEc.woff2',
  '/fonts/56724408_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
  '/fonts/63551c15_8vIJ7ww63mVu7gt79mT7.woff2',
  '/fonts/64b566ad_nuFiD-vYSZviVYUb_rj3ij__anPXDTjYgFE_.woff2',
  '/fonts/920604ae_u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSeqqJ-k.woff2',
  '/fonts/95d26292_nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTXt_A-W2r.woff2',
  '/fonts/983e9094_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2',
  '/fonts/ab7c1a7e_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx_cwhsk.woff2',
  '/fonts/b1b0412a_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxTcwhsk.woff2',
  '/fonts/ba16536d_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx7cwhsk.woff2',
  '/fonts/bb62a722_u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUG3zAvHqYQ.woff2',
  '/fonts/c1f38336_nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTXt7A-W2r.woff2',
  '/fonts/c73bc256_u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSeqnJ-mFqA.woff2',
  '/fonts/d5d5ee6d_u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUG35AvHqYQ.woff2',
  '/fonts/da7d3499_u-4e0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiSeqkJ-mFqA.woff2',
  '/fonts/ec84a376_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2',
  '/fonts/eef1e497_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2',
  '/fonts/f55b8d39_UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2',
  '/fonts/f695e402_u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUG34AvHqYQ.woff2',
  '/fonts/fe142708_tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxPcwhsk.woff2',
];

const STATIC_PRECACHE = RAW_PRECACHE.map((p) => BASE + p);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_PRECACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Precache item missed:', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never intercept non-GET requests (e.g. POST to backend or scan endpoints)
  if (req.method !== 'GET') {
    return;
  }

  // 2. Never cache authentication or scanner API requests
  if (
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/scan') ||
    url.port === '8000' ||
    url.port === '11434'
  ) {
    return;
  }

  // 3. Next.js RSC prefetch & navigation requests (_rsc query)
  if (url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            if (cached) return cached;
            return caches.match(url.pathname, { ignoreSearch: true }).then((pageCached) => {
              if (pageCached) return pageCached;
              return new Response(new Blob(), {
                status: 200,
                headers: { 'Content-Type': 'text/x-component' },
              });
            });
          });
        })
    );
    return;
  }

  // 4. Static assets (/_next/static/, /fonts/, /monaco/, images): Cache-first
  const isStatic =
    url.pathname.includes('/_next/static/') ||
    url.pathname.includes('/fonts/') ||
    url.pathname.includes('/monaco/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/);

  if (isStatic) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return response;
          })
          .catch(() => {
            return cached || Response.error();
          });
      })
    );
    return;
  }

  // 5. Document / Page navigation: Network-first with cache fallback
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(req, { ignoreSearch: true }).then((cached) => {
            if (cached) return cached;
            return caches.match(BASE + '/', { ignoreSearch: true }).then((home) => {
              if (home) return home;
              return caches.match(BASE || '/', { ignoreSearch: true }).then((alt) => {
                if (alt) return alt;
                return caches.match('/', { ignoreSearch: true });
              });
            });
          });
        })
    );
    return;
  }

  // 6. Default: Network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(req, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          return caches.match(BASE + '/', { ignoreSearch: true }).then((home) => {
            if (home) return home;
            return caches.match(BASE || '/', { ignoreSearch: true }).then((alt) => {
              if (alt) return alt;
              return caches.match('/', { ignoreSearch: true });
            });
          });
        });
      })
  );
});
