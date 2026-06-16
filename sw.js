/* 德州撲克 Service Worker
   策略：HTML 網路優先（有網路一定拿最新版，更新不會卡舊版）；
        圖示等靜態資源快取優先（快、省流量）；完全離線時用快取墊檔。 */
const CACHE = 'poker-v17';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-180.png', './icon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // 網路優先（強制向伺服器要最新版，繞過瀏覽器 HTTP 快取）
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return resp; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // 快取優先
    e.respondWith(
      caches.match(req).then(hit =>
        hit || fetch(req).then(resp => { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return resp; })
      )
    );
  }
});
