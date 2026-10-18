const C = 'at-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png', './favicon-48.png'];

self.addEventListener('install', e => {
  // একটি ফাইল না পেলেও যেন ইনস্টল ব্যর্থ না হয়
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  // ডাটা (Apps Script) কখনো ক্যাশ হবে না – সবসময় সরাসরি নেটওয়ার্ক
  if (req.method !== 'GET' || !/^https?:$/.test(u.protocol) || u.hostname === 'script.google.com' || u.hostname.endsWith('googleusercontent.com')) return;

  // পেজ (HTML): আগে নেটওয়ার্ক (নতুন ভার্সন সাথে সাথে), অফলাইনে ক্যাশ
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const copy = r.clone(); caches.open(C).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html').then(m => m || caches.match('./')))
    );
    return;
  }

  // বাকি ফাইল: ক্যাশ থেকে দ্রুত, ব্যাকগ্রাউন্ডে আপডেট
  e.respondWith(caches.open(C).then(c => c.match(req).then(m => {
    const f = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => m || Response.error());
    return m || f;
  })));
});
