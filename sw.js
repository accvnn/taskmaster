// Service worker tối giản: chỉ lưu "vỏ" app (trang mở, icon) để app mở nhanh và báo lỗi mạng gọn gàng.
// Dữ liệu TaskMaster vẫn luôn lấy trực tiếp từ Google Apps Script, không lưu cache.
const CACHE = 'taskmaster-shell-v8';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // không đụng tới Google
  // ⚡ Dùng ngay bản đã lưu (mở tức thì), đồng thời tải bản mới ngầm để lần sau cập nhật
  // Trang app chính (/taskmaster/ hoặc index.html) dùng chung 1 bản lưu; các trang khác (vd /installapp) lưu riêng
  const isAppShell = e.request.mode === 'navigate' && (/\/taskmaster\/$/.test(url.pathname) || /\/index\.html$/.test(url.pathname));
  const key = isAppShell ? './index.html' : e.request;
  const network = fetch(e.request)
    .then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
      return res;
    });
  e.respondWith(
    caches.match(key, { ignoreSearch: true })
      .then((cached) => cached || network)
      .catch(() => caches.match(isAppShell ? './index.html' : e.request, { ignoreSearch: true }))
  );
  e.waitUntil(network.catch(() => {}));
});
