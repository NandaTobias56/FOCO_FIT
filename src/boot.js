/* ---------- início ---------- */
lsLoad(); render();
if(LN)notifSetup().then(()=>{queueNotifSync(200);checkUpdate()});
try{const t=JSON.parse(localStorage.getItem("focofit.timer")||"null");if(t&&t.kind==="cardio"&&S.profile)startCardio(t.mins,t)}catch(e){}
connectDb();
/* links de plano (#p=) e de relatório (#r=), pelo site ou pelo app Android (focofit://i/p/...) */
let lastCode="";
function codeFromUrl(u){const m=String(u||"").match(/[#/](p|r)[=/]([\w-]{8,})/);return m?m[2]:""}
function openCode(c){if(!c||c===lastCode)return;lastCode=c;setTimeout(()=>handleCode(c,true),250)}
openCode(codeFromUrl(location.hash));
window.addEventListener("hashchange",()=>openCode(codeFromUrl(location.hash)));
if(FFN&&FFN.App){try{FFN.App.addListener("appUrlOpen",ev=>openCode(codeFromUrl(ev&&ev.url)));FFN.App.getLaunchUrl().then(r=>openCode(codeFromUrl(r&&r.url))).catch(()=>{})}catch(e){}}
})();
