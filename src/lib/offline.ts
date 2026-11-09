/**
 * Registrerar service workern (public/sw.js), som sparar appens filer på
 * enheten så att Engelskajakten startar även när skolans nät är segt eller
 * borta en stund.
 *
 * Körs som ett litet skript i sidan, efter att den laddats. Inte på den gamla
 * adressen hos Vercel: därifrån skickas eleven vidare direkt, så där finns
 * inget att spara.
 */
export const OFFLINE_SCRIPT = `(function(){
  if(!('serviceWorker' in navigator)) return;
  if(/\\.vercel\\.app$/.test(location.hostname)) return;
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('/sw.js')
      .then(function(){return navigator.serviceWorker.ready;})
      .then(function(reg){
        // Filerna från första laddningen hämtades innan service workern tog
        // över. Be den spara dem, så att nästa start klarar sig utan nät.
        var adresser=performance.getEntriesByType('resource')
          .map(function(r){return r.name;})
          .filter(function(n){return n.indexOf(location.origin+'/')===0;});
        if(reg.active) reg.active.postMessage({typ:'spara',adresser:adresser});
      })
      .catch(function(){/* får aldrig hindra appen från att starta */});
  });
})();`;
