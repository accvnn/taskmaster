// Service worker "tự huỷ": thay cho sw.js cũ của TaskMaster trên github.io.
// Máy nào đã cài/mở app cũ sẽ tải file này, xoá cache cũ, gỡ service worker
// và chuyển sang địa chỉ mới trên Cloudflare.
var NEW_URL = 'https://taskmaster.vietnamnet.workers.dev/';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var ks = await caches.keys();
    await Promise.all(ks.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    var cs = await self.clients.matchAll({ type: 'window' });
    cs.forEach(function (c) {
      var u = new URL(c.url);
      var p = u.pathname.replace(/^\/taskmaster\/*/, '').replace(/^index\.html$/, '');
      c.navigate(NEW_URL + p + u.search + u.hash);
    });
  })());
});
self.addEventListener('fetch', function (e) {
  if (e.request.mode === 'navigate') {
    var u = new URL(e.request.url);
    var p = u.pathname.replace(/^\/taskmaster\/*/, '').replace(/^index\.html$/, '');
    e.respondWith(Response.redirect(NEW_URL + p + u.search + u.hash, 302));
  }
});
