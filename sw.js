const CACHE_NAME="fg-record-v7";
const APP_FILES=["./","./index.html","./style.css?v=7","./app.js?v=7","./manifest.webmanifest","./icon-180.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=="GET") return;
  // Always try the network first for app shell/assets so GitHub Pages deployments are visible immediately.
  if(url.origin===self.location.origin){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        return response;
      }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html")))
    );
  }
});
