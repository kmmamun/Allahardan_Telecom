const C = 'at-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './manifest.json'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
// Stale-while-revalidate: খুব দ্রুত লোড, ব্যাকগ্রাউন্ডে আপডেট
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname === 'script.google.com' || u.hostname.endsWith('googleusercontent.com')) return;
  e.respondWith(caches.open(C).then(c => c.match(e.request).then(m => {
    const f = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => m);
    return m || f;
  })));
});
