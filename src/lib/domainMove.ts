/**
 * Flytten från engelskajakten.vercel.app till engelskajakten.martinsjakter.se.
 *
 * Elevernas framsteg ligger i webbläsaren, och webbläsaren håller adresser
 * isär: på den nya adressen är localStorage tom. Den gamla adressen packar
 * därför ihop allt Engelskajakten har sparat på enheten – alla elever på den,
 * med poäng, kapitel, kistor, märken, streaks, affären och felbanken – och
 * skickar det till den nya adressen efter "#" i länken. Den delen av en adress
 * skickas aldrig till någon server, så framstegen går direkt från webbläsare
 * till webbläsare.
 *
 * Inga framsteg får försvinna. Går de inte att packa (för mycket data, eller
 * ett fel) flyttas eleven inte alls utan fortsätter på den gamla adressen med
 * allt kvar där.
 *
 * Den nya adressen läser bara in datan när ingen av dess egna elever har
 * arbetat med ett kapitel än – en elev som bara loggat in där har inget att
 * förlora – så inget som gjorts där skrivs över.
 *
 * En länk som redan har ett "#" (en flyttlänk /flytta#k=…) behåller det:
 * originalets "#…" följer med i paketet och sätts tillbaka på den nya adressen
 * innan appen läser det.
 *
 * Skriptet körs direkt i <head>, före appens egen kod, så det är vanlig
 * synkron JavaScript: datan är base64url av JSON, utan komprimering
 * (CompressionStream finns inte i synkron form).
 */

/** Slås på när engelskajakten.martinsjakter.se fungerar. Tills dess beter sig den gamla adressen som förut. */
const MOVE_ENABLED = false;

export const DOMAIN_MOVE_SCRIPT = `(function(){try{
var OLD="engelskajakten.vercel.app",NEW="https://engelskajakten.martinsjakter.se",ON=${MOVE_ENABLED},HK="enhet=",MAX=1500000,L=location,S=localStorage;
function app(k){return k.indexOf("engelskajakten")===0||k.indexOf("engelska_")===0||k==="darkMode";}
function own(){try{for(var i=0;i<S.length;i++){var k=S.key(i);if(!k||(k!=="engelskajakten_student"&&k.indexOf("engelskajakten_student_")!==0))continue;var st=(JSON.parse(S.getItem(k)||"{}")||{}).stages||{};for(var s in st){var p=st[s]||{};for(var f in p){if(p[f]&&typeof p[f]==="object"&&Object.keys(p[f]).length)return true;}}}return false;}catch(e){return true;}}
if(ON&&L.hostname===OLD){
var o={},c=0;for(var i=0;i<S.length;i++){var k=S.key(i);if(k&&app(k)){o[k]=S.getItem(k);c++;}}
var d="";if(c||L.hash){var b=new TextEncoder().encode(JSON.stringify({d:o,h:L.hash})),t="";for(var j=0;j<b.length;j+=32768)t+=String.fromCharCode.apply(null,b.subarray(j,j+32768));d=btoa(t).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");if(d.length>MAX)return;d="#"+HK+d;}
document.documentElement.style.visibility="hidden";L.replace(NEW+L.pathname+L.search+d);return;}
if(L.hash.indexOf("#"+HK)===0){
var raw=L.hash.slice(1+HK.length);history.replaceState(null,"",L.pathname+L.search);
var x=atob(raw.replace(/-/g,"+").replace(/_/g,"/")),u=new Uint8Array(x.length);for(var q=0;q<x.length;q++)u[q]=x.charCodeAt(q);
var p=JSON.parse(new TextDecoder().decode(u)),a=p.d||{};
if(typeof p.h==="string"&&p.h.charAt(0)==="#")history.replaceState(null,"",L.pathname+L.search+p.h);
if(own())return;
for(var key in a){if(app(key)&&typeof a[key]==="string")S.setItem(key,a[key]);}
}
}catch(e){}})();`;
