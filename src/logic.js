
/* ---------- itens do guarda-roupa ---------- */
const ITEMS = [
  {id:"bone",tipo:"hat",nome:"Boné"},{id:"laco",tipo:"hat",nome:"Laço"},{id:"fone",tipo:"hat",nome:"Fone"},
  {id:"faixa",tipo:"hat",nome:"Faixa ninja"},{id:"coroa",tipo:"hat",nome:"Coroa"},{id:"aureola",tipo:"hat",nome:"Auréola"},
  {id:"academia",tipo:"bg",nome:"Academia"},{id:"praia",tipo:"bg",nome:"Praia"},{id:"por",tipo:"bg",nome:"Pôr do sol"},
  {id:"espaco",tipo:"bg",nome:"Espaço"},{id:"floresta",tipo:"bg",nome:"Floresta"}
];
const PROMESSAS = [
  {id:"refeicoes",t:"Seguir todas as refeições principais"},
  {id:"cardio",t:"Fazer meu cardio"},
  {id:"agua",t:"Beber toda a água"},
  {id:"treino",t:"Treinar com tudo"}
];

/* ---------- utilidades ---------- */
const $ = (s,el=document)=>el.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const pad = n=>String(n).padStart(2,"0");
const keyOf = d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const dateOf = k=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const addDays = (k,n)=>{const d=dateOf(k);d.setDate(d.getDate()+n);return keyOf(d)};
const todayKey = ()=>keyOf(new Date());
const weekKey = k=>{const d=dateOf(k);const wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);return keyOf(d)};
const fmtDay = k=>{const d=dateOf(k);return WDL[d.getDay()]+", "+d.getDate()+" "+MES[d.getMonth()]};
const num = v=>{const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:null};
const kg = n=>n.toFixed(1).replace(".",",");
const reduced = ()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};

/* IA só existe dentro do Claude (não no app Android nem no site) */
const NO_AI = !!window.FFNative || !(window.claude&&window.claude.use);

/* ---------- dieta ---------- */
const horaNum = h=>{const m=String(h||"").match(/(\d{1,2})\s*[h:]?\s*(\d{2})?/);if(!m)return 12;return Math.min(23,+m[1])+(m[2]?Math.min(59,+m[2])/60:0)};
const fmtHora = n=>pad(Math.floor(n))+":"+pad(Math.round((n%1)*60)%60);
const toMin = h=>Math.round(horaNum(h)*60);
function tipoFrom(nome,hora){
  const n=norm(nome);
  if(/cafe|desjejum/.test(n))return "cafe";
  if(/almoc/.test(n))return "almoco";
  if(/jantar|janta/.test(n))return "jantar";
  if(/ceia/.test(n))return "ceia";
  if(/pre.?treino|pos.?treino|tarde/.test(n))return "pre";
  if(/lanche|colacao/.test(n))return "lanche";
  const h=horaNum(hora);return h<9?"cafe":h<11?"lanche":h<14.5?"almoco":h<18.5?"pre":h<22?"jantar":"ceia";
}
function normalizeMeals(list){
  const seen={}; const out=[];
  (Array.isArray(list)?list:[]).slice(0,8).forEach(m=>{
    if(!m)return; const nome=String(m.nome||"").trim().slice(0,40)||"Refeição";
    const hora=fmtHora(horaNum(m.hora)); const tipo=TIPOS[m.tipo]?m.tipo:tipoFrom(nome,hora);
    let id=tipo; if(seen[id]){id=tipo+(++seen[tipo])}else seen[id]=1;
    const itens=(Array.isArray(m.itens)?m.itens:String(m.itens||"").split("\n")).map(x=>String(x).trim().replace(/^[-*•]\s*/,"")).filter(Boolean).slice(0,8).map(x=>x.slice(0,80));
    out.push({id,tipo,hora,nome,itens,main:m.main!==false&&m.principal!==false&&!/opcional/.test(norm(nome))});
  });
  return out.sort((a,b)=>horaNum(a.hora)-horaNum(b.hora));
}
function templateMeals(obj,acordar){
  const t=TEMPLATES[obj]||TEMPLATES.emagrecer, base=toMin(acordar||"06:00");
  return normalizeMeals(t.meals.map(m=>({...m,hora:fmtHora(Math.min(23.5,(base+m.off)/60))})));
}
const DIETA = ()=>{const d=P().dieta;return d&&d.length?d:MARIA_DIETA};
const MARIA_DIETA = normalizeMeals([
  {tipo:"cafe",hora:"06:20",nome:"Café da manhã",itens:["1 pão francês","2 ovos (ou 1, conforme a fome)","Café com leite"]},
  {tipo:"lanche",hora:"09:00",nome:"Lanche (opcional)",main:false,itens:["1 banana ou outra fruta da estação"]},
  {tipo:"almoco",hora:"11:30",nome:"Almoço na Riofer",itens:["3–4 colheres de arroz","1 concha de feijão","1 porção de carne ou frango","Salada ou legumes à vontade"]},
  {tipo:"pre",hora:"16:00",nome:"Lanche pré-treino",itens:["1 pão francês com 1–2 ovos","ou 1 banana com aveia e leite"]},
  {tipo:"jantar",hora:"20:30",nome:"Jantar",itens:["3–4 colheres de arroz","1 concha de feijão","2 ovos ou porção de frango","Legumes ou salada"]}]);
/* leitura simples de dieta colada (funciona sem IA) */
function parseDietText(txt){
  const lines=String(txt||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean); const meals=[]; let cur=null;
  const timeRe=/(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i;
  const mealWord=/caf[eé]|lanche|almo[cç]o|jantar|janta|ceia|refei[cç][aã]o|desjejum|pr[eé].?treino|p[oó]s.?treino|cola[cç][aã]o/i;
  lines.forEach(l=>{
    const bullet=/^[-*•·]\s*/.test(l); const clean=l.replace(/^[-*•·]\s*/,"");
    if(!bullet&&mealWord.test(clean)&&(timeRe.test(clean)||clean.length<40)){
      const tm=clean.match(timeRe); let nome=clean.split(/\s[—–-]\s/).slice(-1)[0];
      if(clean.split(/\s[—–-]\s/).length>1&&timeRe.test(nome)&&!mealWord.test(nome))nome=clean.split(/\s[—–-]\s/)[0];
      nome=nome.replace(/,?\s*(por volta|às|as)\b.*$/i,"").replace(timeRe,"").replace(/[–—-]\s*\d.*$/,"").replace(/^[\s\d.:)–—-]+/,"").split(",")[0].trim();
      cur={nome:nome||"Refeição",hora:tm?tm[1]+":"+(tm[2]||"00"):"",itens:[],main:!/opcional/i.test(clean)};meals.push(cur);return;
    }
    if(cur&&(bullet||(clean.length<50&&!/[.!?]$/.test(clean))))cur.itens.push(clean.replace(/;\s*ou$/i," ou").replace(/;$/,""));
  });
  let lastH=6; meals.forEach(m=>{if(!m.hora){lastH+=3;m.hora=fmtHora(Math.min(22,lastH))}else lastH=horaNum(m.hora)});
  return normalizeMeals(meals.filter(m=>m.itens.length||m.nome));
}

/* ---------- lembretes ---------- */
function gcalLink(title,hora,details,recur){
  const d=new Date(), k=keyOf(d).replace(/-/g,""), h=horaNum(hora), st=k+"T"+pad(Math.floor(h))+pad(Math.round((h%1)*60)%60)+"00";
  const e=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(h),Math.round((h%1)*60)+15);
  const en=keyOf(e).replace(/-/g,"")+"T"+pad(e.getHours())+pad(e.getMinutes())+"00";
  let tz="America/Sao_Paulo";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||tz}catch(x){}
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(title)+"&details="+encodeURIComponent(details)+"&dates="+st+"/"+en+"&ctz="+encodeURIComponent(tz)+"&recur="+encodeURIComponent(recur||"RRULE:FREQ=DAILY");
}
const BYDAY=["SU","MO","TU","WE","TH","FR","SA"];
function buildICS(opts){
  const t=keyOf(new Date()).replace(/-/g,""), stamp=new Date().toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const ev=[]; let n=0;
  const add=(title,hora,desc,rrule)=>{const h=horaNum(hora);const hh=pad(Math.floor(h)),mm=pad(Math.round((h%1)*60)%60);
    ev.push(["BEGIN:VEVENT","UID:focofit-"+(n++)+"-"+t+"@focofit","DTSTAMP:"+stamp,"DTSTART:"+t+"T"+hh+mm+"00","DURATION:PT15M","RRULE:"+rrule,
      "SUMMARY:"+title.replace(/[,;]/g," "),"DESCRIPTION:"+desc.replace(/[,;]/g," ").replace(/\n/g,"\\n"),
      "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+title.replace(/[,;]/g," "),"TRIGGER:PT0M","END:VALARM","END:VEVENT"].join("\r\n"))};
  DIETA().forEach(m=>add("Foco Fit: "+m.nome,m.hora,m.itens.join(" / "),"FREQ=DAILY"));
  const tdays=[0,1,2,3,4,5,6].filter(i=>treinoDo2(i)); if(tdays.length&&opts.treino)add("Foco Fit: hora do treino",P().treinoHora||"18:00","Só ir já é 80% da vitória.","FREQ=WEEKLY;BYDAY="+tdays.map(i=>BYDAY[i]).join(","));
  if(opts.agua){const a=horaNum(P().acordar||"06:00");for(let h=a+2;h<=21;h+=2.5)add("Foco Fit: beba água",fmtHora(h),"Um copo agora.","FREQ=DAILY")}
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Foco Fit//PT-BR","CALSCALE:GREGORIAN"].concat(ev).concat(["END:VCALENDAR"]).join("\r\n");
}
const treinoDo2 = wd=>{const t=P().treinos||DEFAULT_TREINOS;return t[wd]||""};
function remindersHTML(){
  if(window.FFNative)return notifSettingsHTML();
  const tdays=[0,1,2,3,4,5,6].filter(i=>treinoDo2(i));
  if(!window.claude||!window.claude.use)return `<div class="stack"><div class="tip">Coloque os horários da sua dieta como alarmes no calendário do celular. Ele avisa na hora, mesmo com o app fechado.</div>
    <button class="btn cyan big full" data-act="ics">Adicionar alarmes ao Calendário</button>
    <div class="tip"><b style="color:var(--ink)">iPhone:</b> toque no botão e depois em “Adicionar tudo”. <b style="color:var(--ink)">Android:</b> abra o arquivo baixado com o app de calendário, ou use os botões abaixo.</div>
    ${DIETA().map(m=>`<a class="remind" href="${esc(gcalLink("Foco Fit: "+m.nome,m.hora,m.itens.join(" / ")))}" target="_blank" rel="noopener"><b>${m.hora}</b><span>${esc(m.nome)}</span><i>Google</i></a>`).join("")}
    <div class="tip">Mudou os horários da dieta? Adicione de novo e apague os antigos no calendário.</div></div>`;
  return `<div class="stack"><div class="tip">Toque em cada um para criar um alarme diário no Google Agenda do celular. Ele avisa no horário mesmo com o app fechado.</div>
    ${DIETA().map(m=>`<a class="remind" href="${esc(gcalLink("Foco Fit: "+m.nome,m.hora,m.itens.join(" / ")))}" target="_blank" rel="noopener"><b>${m.hora}</b><span>${esc(m.nome)}</span><i>+ Agenda</i></a>`).join("")}
    ${tdays.length?`<a class="remind" href="${esc(gcalLink("Foco Fit: hora do treino",P().treinoHora||"18:00","Só ir já é 80% da vitória.","RRULE:FREQ=WEEKLY;BYDAY="+tdays.map(i=>BYDAY[i]).join(",")))}" target="_blank" rel="noopener"><b>${esc(P().treinoHora||"18:00")}</b><span>Treino (${tdays.map(i=>WD[i]).join(", ")})</span><i>+ Agenda</i></a>`:""}
    <button class="btn full" data-act="ics">Baixar todos de uma vez (com lembretes de água)</button>
    <div class="tip">O arquivo baixado abre no app de calendário do celular. Se o Google Agenda não abrir, use os botões acima.</div></div>`;
}

/* ---------- estado e salvamento ---------- */
let S = {profile:null, days:{}};
let view = {tab:"hoje", day:todayKey()};
const LS = "focofit.v1";
function lsLoad(){try{const r=localStorage.getItem(LS);if(r){const o=JSON.parse(r);if(o&&typeof o==="object")S={profile:o.profile||null,days:o.days||{}}}}catch(e){}}
function lsSave(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
let col=null; const pending=new Map(); let flushT=null;
function queue(id,data){if(!col)return;pending.set(id,data);clearTimeout(flushT);flushT=setTimeout(flush,700)}
async function flush(){const items=[...pending.entries()];pending.clear();for(const [id,data] of items){try{await col.doc(id).set(data)}catch(e){console.warn("save",id,e)}}}
function saveProfile(){lsSave();queue("profile",{v:2,profile:S.profile});if(window.FFNative)queueNotifSync()}
function saveDay(k){lsSave();queue("d"+k,{date:k,day:S.days[k]||{}});if(window.FFNative)queueNotifSync(4000)}
async function connectDb(){
  try{
    if(!window.claude||!window.claude.use)return;
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db||!user)return;
    const uid=await user.id(); if(!uid)return;
    const c=db.collection("data/users/"+uid);
    const snap=await c.limit(1000).get();
    col=c;
    if(snap.empty){if(S.profile){queue("profile",{v:2,profile:S.profile});Object.keys(S.days).forEach(k=>queue("d"+k,{date:k,day:S.days[k]}))}return}
    const next={profile:null,days:{}};
    snap.forEach(doc=>{const d=doc.data()||{};if(doc.id==="pro"){if(d.pro&&!PRO){PRO=d.pro;try{localStorage.setItem(LSP,JSON.stringify(PRO))}catch(e){}}}else if(doc.id==="profile")next.profile=d.profile||null;else if(d.date)next.days[d.date]=d.day||{}});
    if(next.profile){S=next;lsSave();lastLevel=null;render()}
  }catch(e){console.warn("db",e)}
}

/* ---------- regras do jogo ---------- */
const P = ()=>S.profile||{};
const treinoDo = k=>{const t=P().treinos||DEFAULT_TREINOS;return t[dateOf(k).getDay()]||""};
const aguaMeta = ()=>P().aguaMeta||8;
const cardioMeta = ()=>P().cardioMeta||15;
function mealXP(m,main){
  if(!m)return 0;
  if(m.s==="ok")return main?10:5;
  if(m.s==="troca")return m.v==="ok"?(main?10:5):m.v==="mod"?(main?7:4):2;
  return 0;
}
const goodMeal = m=>m&&(m.s==="ok"||(m.s==="troca"&&m.v!=="no"));
function promiseKept(id,d,k){
  const meals=d.meals||{};
  if(id==="refeicoes")return DIETA().filter(x=>x.main).every(x=>goodMeal(meals[x.id]));
  if(id==="cardio")return !!d.cardio;
  if(id==="agua")return (d.agua||0)>=aguaMeta();
  if(id==="treino")return !!d.treino;
  return false;
}
function dayInfo(k){
  const d=S.days[k]||{}; const meals=d.meals||{};
  const mains=DIETA().filter(x=>x.main);
  const good=mains.filter(x=>goodMeal(meals[x.id])).length;
  const treinoDia=!!treinoDo(k);
  const need=Math.max(1,Math.ceil(mains.length*.75));
  const complete = good>=need && (!treinoDia||!!d.treino);
  let xp=0; DIETA().forEach(x=>xp+=mealXP(meals[x.id],x.main));
  if(d.treino)xp+=treinoDia?30:15;
  if(d.cardio)xp+=d.cardio>=cardioMeta()?20:10;
  if((d.agua||0)>=aguaMeta())xp+=10;
  if(complete)xp+=20;
  if(complete&&d.cardio)xp+=10;
  if(d.doce)xp+=15;
  const kept=d.promessa?promiseKept(d.promessa,d,k):false;
  if(kept)xp+=25;
  if(d.bau)xp+=d.bau==="xp"?40:10;
  const logged = Object.keys(meals).length>0||!!d.treino||!!d.cardio||(d.agua||0)>0;
  /* missões do anel */
  const total=mains.length+(treinoDia?1:0)+2;
  const done=good+(treinoDia&&d.treino?1:0)+(d.cardio?1:0)+((d.agua||0)>=aguaMeta()?1:0);
  return {complete,good,need,mains:mains.length,xp,logged,treinoDia,d,kept,total,done};
}
function owned(){const o=new Set();Object.values(S.days).forEach(d=>{if(d.bau&&d.bau!=="xp")o.add(d.bau)});return o}
function computeAll(){
  const keys=Object.keys(S.days).sort();
  const start=P().criado||todayKey();
  let xp=0,treinos=0,cardios=0,cardioMin=0,trocasBoas=0,aguaDias=0,perfeitos=0,doces=0,promessas=0;
  keys.forEach(k=>{const i=dayInfo(k);xp+=i.xp;if(i.d.treino)treinos++;if(i.d.cardio){cardios++;cardioMin+=i.d.cardio}if(i.complete)perfeitos++;if(i.d.doce)doces++;if(i.kept)promessas++;
    if((i.d.agua||0)>=aguaMeta())aguaDias++;
    Object.values(i.d.meals||{}).forEach(m=>{if(m.s==="troca"&&m.v==="ok")trocasBoas++})});
  const t=todayKey(); const status={}; const usedWeeks=new Set();
  let streak=0; const todayDone=dayInfo(t).complete; let k=todayDone?t:addDays(t,-1);
  while(k>=start){
    const i=dayInfo(k);
    if(i.complete){streak++;status[k]="done"}
    else if(!usedWeeks.has(weekKey(k))){usedWeeks.add(weekKey(k));status[k]="shield"}
    else break;
    k=addDays(k,-1);
  }
  if(streak===0){usedWeeks.clear();Object.keys(status).forEach(x=>{if(status[x]==="shield")delete status[x]})}
  let best=0,run=0,prev=null;
  keys.forEach(x=>{if(dayInfo(x).complete){run=(prev&&addDays(prev,1)===x)?run+1:1;best=Math.max(best,run);prev=x}});
  best=Math.max(best,streak);
  return {xp,treinos,cardios,cardioMin,trocasBoas,aguaDias,perfeitos,doces,promessas,streak,best,status,shieldThisWeek:!usedWeeks.has(weekKey(t))};
}
const xpFor = L=>50*L*(L-1);
function levelOf(xp){let L=1;while(xp>=xpFor(L+1))L++;return {L,cur:xp-xpFor(L),need:xpFor(L+1)-xpFor(L)}}
const STAGES=[["Iniciante",1],["Determinada",3],["Focada",5],["Imparável",8],["Lenda",12]];
const stageOf = L=>{let s=0;STAGES.forEach((x,i)=>{if(L>=x[1])s=i});return s};
function isTired(){
  const t=todayKey(),y=addDays(t,-1);
  if(!S.profile||(P().criado||t)>=t)return false;
  return !dayInfo(t).logged && !dayInfo(y).logged;
}

/* ---------- avatar ---------- */
const COLORS=["#FF4F9A","#3CDCF7","#3DE38D","#FF9A3C","#9C6BFF","#FFD84A","#B9774A","#9AA3B5","#F4EEF8"];
const SKINS=["var(--skin1)","var(--skin2)","var(--skin3)","var(--skin4)"];
const HAIRS=["#2B1A12","#6B3E1E","#C7863A","#F0CF6E","#E2557E","#7B5CFF"];
const HAIR_STYLES=[["rabo","Rabo de cavalo"],["coque","Coque"],["solto","Longo"],["curto","Curto"]];
const TYPES=[["atleta","Atleta"],["gatinha","Gatinha"],["cachorro","Cachorrinho"],["raposa","Raposinha"],["coelho","Coelhinha"],["dragao","Dragãozinho"],["robo","Robô"],["planta","Plantinha"]];
const TYPE_COLOR={atleta:"#FF4F9A",gatinha:"#9AA3B5",cachorro:"#B9774A",raposa:"#FF9A3C",coelho:"#F4EEF8",dragao:"#3DE38D",robo:"#3CDCF7",planta:"#FF4F9A"};
const INK="#2a1450", OL=`stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"`;
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt<0?v*amt:(255-v)*amt))));return "#"+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,"0")).join("")}
function hatSVG(id,x,y){
  switch(id){
    case "bone":return `<path d="M${x-24} ${y+12} q1 -26 24 -26 q23 0 24 26z" fill="#FF4F9A" ${OL}/><path d="M${x+12} ${y+11} h26 q4 5 -3 7 h-23z" fill="#C9246D" ${OL}/><circle cx="${x}" cy="${y-14}" r="3.5" fill="#C9246D"/>`;
    case "laco":return `<g transform="translate(${x+18} ${y+4})"><path d="M0 0 L-15 -10 L-15 10z M0 0 L15 -10 L15 10z" fill="#FF4F9A" ${OL}/><circle r="5" fill="#C9246D" ${OL}/></g>`;
    case "fone":return `<path d="M${x-27} ${y+26} q0 -32 27 -32 q27 0 27 32" fill="none" stroke="${INK}" stroke-width="5"/><rect x="${x-34}" y="${y+16}" width="12" height="20" rx="6" fill="#3CDCF7" ${OL}/><rect x="${x+22}" y="${y+16}" width="12" height="20" rx="6" fill="#3CDCF7" ${OL}/>`;
    case "faixa":return `<rect x="${x-26}" y="${y+8}" width="52" height="9" rx="4" fill="#FF6464" ${OL}/><path d="M${x+22} ${y+12} l15 -5 l-4 9z M${x+22} ${y+13} l13 9 l-9 1z" fill="#FF6464" ${OL}/>`;
    case "coroa":return `<path d="M${x-17} ${y+8} l4 -19 7 10 6 -15 6 15 7 -10 4 19z" fill="#FFD84A" ${OL}/><circle cx="${x}" cy="${y+1}" r="3" fill="#FF4F9A"/>`;
    case "aureola":return `<ellipse cx="${x}" cy="${y-9}" rx="20" ry="6" fill="none" stroke="#FFD84A" stroke-width="5"/><ellipse cx="${x}" cy="${y-9}" rx="20" ry="6" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
  }
  return "";
}
function faceParts(tired,y,col,noMouth){
  col=col||INK;
  const eyes=tired
    ?`<path d="M45 ${y}q5 4 10 0M65 ${y}q5 4 10 0" stroke="${col}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`
    :`<g class="eyes"><ellipse cx="50" cy="${y}" rx="4.6" ry="5.8" fill="${col}"/><ellipse cx="70" cy="${y}" rx="4.6" ry="5.8" fill="${col}"/><circle cx="51.8" cy="${y-2.2}" r="1.9" fill="#fff"/><circle cx="71.8" cy="${y-2.2}" r="1.9" fill="#fff"/><circle cx="48.5" cy="${y+2}" r=".9" fill="#fff"/><circle cx="68.5" cy="${y+2}" r=".9" fill="#fff"/></g>`;
  const mouth=tired
    ?`<path d="M56 ${y+13}q4 -3 8 0" stroke="${col}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    :`<path d="M54.5 ${y+10}q5.5 8 11 0z" fill="${col}"/><path d="M57 ${y+13}q3 2 6 0" fill="#FF7FA8"/>`;
  const cheeks=`<ellipse cx="42" cy="${y+8}" rx="4.5" ry="3" fill="#FF7FA8" opacity=".55"/><ellipse cx="78" cy="${y+8}" rx="4.5" ry="3" fill="#FF7FA8" opacity=".55"/>`;
  return eyes+cheeks+(noMouth?"":mouth);
}
function avatarSVG(a,stage,tired,opt){
  opt=opt||{};
  a=a||{type:"atleta",color:COLORS[0],skin:1};
  const type=a.type||"atleta", c=a.color||TYPE_COLOR[type]||COLORS[0], dk=shade(c,-.25), lt=shade(c,.55);
  const sk=SKINS[a.skin??1], hair=a.hair||HAIRS[0], hs=a.hairStyle||"rabo", hat=opt.noHat?null:a.hat;
  const gold="#FFD84A"; let back="",g="",head={x:60,y:24};
  const zz=(x,y)=>tired?`<text x="${x}" y="${y}" font-size="15" font-weight="900" fill="#fff" opacity=".85" font-family="sans-serif">z</text><text x="${x+9}" y="${y-10}" font-size="11" font-weight="900" fill="#fff" opacity=".6" font-family="sans-serif">z</text>`:"";
  const cape=stage>=3?`<path d="M42 84 Q30 112 24 134 L96 134 Q90 112 78 84z" fill="${gold}" ${OL}/><path d="M42 84 Q31 112 26 132 L36 132 Q40 108 48 86z" fill="#fff" opacity=".25"/>`:"";
  const bandana=(y)=>stage>=1?`<path d="M42 ${y} q18 8 36 0 l-2 7 q-16 7 -32 0z" fill="#FF4F9A" ${OL}/><path d="M56 ${y+6} l4 10 4 -10z" fill="#FF4F9A" ${OL}/>`:"";
  const dumbbell=(x,y)=>stage>=2?`<g transform="translate(${x} ${y}) rotate(${tired?0:-25})"><rect x="-12" y="-2.5" width="24" height="5" rx="2.5" fill="#8a8aa0" ${OL}/><rect x="-17" y="-9" width="7" height="18" rx="2.5" fill="${INK}"/><rect x="10" y="-9" width="7" height="18" rx="2.5" fill="${INK}"/></g>`:"";
  if(type==="atleta"){
    back+=cape;
    if(hs==="rabo")back+=`<path d="M80 34 q22 6 14 38 q-4 -16 -16 -22z" fill="${hair}" ${OL}/><circle cx="82" cy="36" r="4" fill="#FF4F9A" ${OL}/>`;
    if(hs==="coque")back+=`<circle cx="60" cy="20" r="12" fill="${hair}" ${OL}/>`;
    if(hs==="solto")back+=`<path d="M32 50 q-4 34 6 46 h44 q10 -12 6 -46z" fill="${hair}" ${OL}/>`;
    g+=`<rect x="47" y="112" width="10" height="16" rx="4" fill="${sk}" ${OL}/><rect x="63" y="112" width="10" height="16" rx="4" fill="${sk}" ${OL}/>
      <path d="M42 128 h16 v5 a3 3 0 0 1 -3 3 h-13 a4 4 0 0 1 0 -8z" fill="#fff" ${OL}/><path d="M62 128 h16 a4 4 0 0 1 0 8 h-13 a3 3 0 0 1 -3 -3z" fill="#fff" ${OL}/>
      <rect x="44" y="102" width="32" height="14" rx="5" fill="${INK}"/>
      <path d="M44 84 q16 -6 32 0 l2 22 h-36z" fill="${c}" ${OL}/><path d="M50 90 h20" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>
      <rect x="${tired?33:30}" y="${tired?86:70}" width="11" height="26" rx="5.5" fill="${sk}" ${OL} transform="rotate(${tired?8:28} 38 86)"/>
      <rect x="${tired?76:79}" y="${tired?86:70}" width="11" height="26" rx="5.5" fill="${sk}" ${OL} transform="rotate(${tired?-8:-28} 84 86)"/>
      <circle cx="33" cy="56" r="5" fill="${sk}" ${OL}/><circle cx="87" cy="56" r="5" fill="${sk}" ${OL}/>
      <circle cx="60" cy="52" r="28" fill="${sk}" ${OL}/>`;
    g+= hs==="curto"
      ?`<path d="M32 54 q-2 -32 28 -32 q30 0 28 32 q-4 -10 -10 -14 q-6 8 -22 8 q-12 0 -18 -8 q-4 6 -6 14z" fill="${hair}" ${OL}/>`
      :`<path d="M32 56 q-3 -34 28 -34 q31 0 28 34 q-6 -12 -14 -16 q-4 6 -14 8 q4 -6 2 -10 q-10 12 -24 14 q-4 2 -6 4z" fill="${hair}" ${OL}/>`;
    g+=faceParts(tired,55);
    g+=bandana(80).replace(/#FF4F9A/g,stage>=1?"#FF4F9A":"none");
    if(stage>=1&&!hat)g+=`<rect x="34" y="36" width="52" height="7" rx="3.5" fill="#FF4F9A" ${OL}/>`;
    g+=dumbbell(tired?88:96,tired?110:62);
    head={x:60,y:hs==="coque"?14:22};
  } else if(type==="robo"){
    back+=cape;
    g+=`<rect x="44" y="116" width="12" height="14" rx="3" fill="${dk}" ${OL}/><rect x="64" y="116" width="12" height="14" rx="3" fill="${dk}" ${OL}/>
      <rect x="40" y="128" width="18" height="7" rx="3" fill="${INK}"/><rect x="62" y="128" width="18" height="7" rx="3" fill="${INK}"/>
      <path d="M34 ${tired?92:84} q-8 10 -6 20" stroke="${dk}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M86 ${tired?92:84} q8 ${tired?10:-12} 6 ${tired?20:-20}" stroke="${dk}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <rect x="38" y="80" width="44" height="38" rx="12" fill="${c}" ${OL}/><rect x="46" y="88" width="28" height="16" rx="5" fill="${INK}"/>
      <circle cx="54" cy="96" r="3" fill="${tired?"#555":"#3DE38D"}"/><circle cx="62" cy="96" r="3" fill="${tired?"#555":"#FFD84A"}"/><circle cx="70" cy="96" r="3" fill="${tired?"#555":"#FF4F9A"}"/>
      <line x1="60" y1="24" x2="60" y2="12" stroke="${INK}" stroke-width="3"/><circle cx="60" cy="10" r="5" fill="${tired?"#777":"#FF4F9A"}" ${OL}/>
      <rect x="26" y="44" width="8" height="18" rx="3" fill="${dk}" ${OL}/><rect x="86" y="44" width="8" height="18" rx="3" fill="${dk}" ${OL}/>
      <rect x="30" y="24" width="60" height="54" rx="18" fill="${lt}" ${OL}/><rect x="36" y="32" width="48" height="38" rx="12" fill="${INK}"/>`;
    g+= tired?`<path d="M44 52 h10 M66 52 h10" stroke="#3CDCF7" stroke-width="4" stroke-linecap="round"/><path d="M55 62 h10" stroke="#3CDCF7" stroke-width="3" stroke-linecap="round"/>`
      :`<g class="eyes"><rect x="44" y="43" width="10" height="14" rx="5" fill="#3CDCF7"/><rect x="66" y="43" width="10" height="14" rx="5" fill="#3CDCF7"/></g><path d="M53 61 q7 6 14 0" stroke="#3CDCF7" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="62" rx="4" ry="2.5" fill="#FF7FA8" opacity=".7"/><ellipse cx="78" cy="62" rx="4" ry="2.5" fill="#FF7FA8" opacity=".7"/>`;
    g+=bandana(78);
    g+=dumbbell(tired?92:98,tired?112:66);
    head={x:60,y:20};
  } else if(type==="planta"){
    const h=[22,34,44,54,60][stage]; const top=100-h; const droop=tired?10:0;
    head={x:60,y:top-14};
    g+=`<path d="M60 100 Q${tired?66:60} ${top+h/2} 60 ${top}" stroke="#2F9E52" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    const leaf=(y,dir,s)=>`<path d="M60 ${y} q${dir*14} ${-13+droop} ${dir*28*s} ${droop} q${-dir*12} ${12} ${-dir*28*s} ${-droop}z" fill="#5CD07A" ${OL}/><path d="M60 ${y} q${dir*12} ${-2+droop} ${dir*24*s} ${droop}" stroke="#2F9E52" stroke-width="1.5" fill="none"/>`;
    g+=leaf(top+10,-1,.8)+leaf(top+10,1,.8);
    if(stage>=1)g+=leaf(top+24,1,1)+leaf(top+24,-1,1);
    if(stage>=2)g+=leaf(top+38,-1,1.1)+leaf(top+38,1,.9);
    if(stage>=3){const fy=top-6;g+=`<g>${[0,72,144,216,288].map(r=>`<ellipse cx="60" cy="${fy-10}" rx="7" ry="11" transform="rotate(${r} 60 ${fy})" fill="#FF4F9A" ${OL}/>`).join("")}</g><circle cx="60" cy="${fy}" r="7" fill="${gold}" ${OL}/>`;head.y=fy-24}
    else g+=`<circle cx="60" cy="${top-3}" r="${4+stage*2}" fill="#8BE39D" ${OL}/>`;
    g+=`<path d="M34 100 H86 L79 136 H41z" fill="${c}" ${OL}/><rect x="30" y="94" width="60" height="12" rx="5" fill="${dk}" ${OL}/><path d="M40 110 L45 132" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>`;
    g+=faceParts(tired,116,INK).replace(/fill="#2a1450"/g,`fill="${INK}"`);
  } else {
    /* bichinhos fofos: corpo pequeno e cabeça grande */
    const belly = type==="coelho"?"#FFE3EE":type==="dragao"?shade("#FFD84A",.2):"#FFF6EE";
    back+=cape;
    if(type==="dragao")back+=`<path d="M40 92 q-26 -20 -24 -2 q4 4 10 2 q-4 8 4 10 q4 -2 10 -4z" fill="${lt}" ${OL}/><path d="M80 92 q26 -20 24 -2 q-4 4 -10 2 q4 8 -4 10 q-4 -2 -10 -4z" fill="${lt}" ${OL}/>`;
    const tail={gatinha:`<path d="M80 116 q24 0 18 -30" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M80 116 q24 0 18 -30" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".0"/>`,
      cachorro:`<path d="M80 112 q16 -2 16 -16" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>`,
      raposa:`<path d="M78 118 q34 4 26 -30 q-10 10 -26 14z" fill="${c}" ${OL}/><path d="M104 88 q-4 8 -12 10 q8 -10 6 -16z" fill="#fff" ${OL}/>`,
      coelho:`<circle cx="82" cy="118" r="9" fill="#fff" ${OL}/>`,
      dragao:`<path d="M80 118 q26 6 28 -12 l6 -2 -4 8 q-6 14 -30 14z" fill="${c}" ${OL}/>`}[type]||"";
    back+=tail;
    const ears={gatinha:`<path d="M30 46 L34 14 L56 34z" fill="${c}" ${OL}/><path d="M90 46 L86 14 L64 34z" fill="${c}" ${OL}/><path d="M36 38 L37 24 L48 34z" fill="#FFB3CE"/><path d="M84 38 L83 24 L72 34z" fill="#FFB3CE"/>`,
      cachorro:"",
      raposa:`<path d="M28 48 L30 8 L58 32z" fill="${c}" ${OL}/><path d="M92 48 L90 8 L62 32z" fill="${c}" ${OL}/><path d="M32 30 L31 14 L44 26z" fill="${INK}"/><path d="M88 30 L89 14 L76 26z" fill="${INK}"/>`,
      coelho:`<ellipse cx="46" cy="14" rx="9" ry="24" fill="${c}" ${OL} transform="rotate(-10 46 30)"/><ellipse cx="74" cy="14" rx="9" ry="24" fill="${c}" ${OL} transform="rotate(${tired?40:10} 74 30)"/><ellipse cx="46" cy="16" rx="4.5" ry="17" fill="#FFB3CE" transform="rotate(-10 46 30)"/><ellipse cx="74" cy="16" rx="4.5" ry="17" fill="#FFB3CE" transform="rotate(${tired?40:10} 74 30)"/>`,
      dragao:`<path d="M40 30 l-6 -20 14 14z" fill="#FFD84A" ${OL}/><path d="M80 30 l6 -20 -14 14z" fill="#FFD84A" ${OL}/>`}[type]||"";
    g+=`<ellipse cx="47" cy="130" rx="11" ry="6" fill="${c}" ${OL}/><ellipse cx="73" cy="130" rx="11" ry="6" fill="${c}" ${OL}/>
      <ellipse cx="60" cy="108" rx="25" ry="23" fill="${c}" ${OL}/><ellipse cx="60" cy="113" rx="15" ry="14" fill="${belly}"/>`;
    if(type==="dragao")g+=`<path d="M50 106 h20 M48 113 h24 M50 120 h20" stroke="${shade("#FFD84A",-.2)}" stroke-width="2" stroke-linecap="round"/>`;
    g+=`<ellipse cx="${tired?38:34}" cy="${tired?110:98}" rx="7" ry="10" fill="${c}" ${OL} transform="rotate(${tired?10:40} 36 104)"/><ellipse cx="${tired?82:86}" cy="${tired?110:98}" rx="7" ry="10" fill="${c}" ${OL} transform="rotate(${tired?-10:-40} 84 104)"/>`;
    g+=ears;
    if(type==="cachorro")g+=`<ellipse cx="30" cy="${tired?62:56}" rx="10" ry="20" fill="${dk}" ${OL} transform="rotate(${tired?20:12} 30 50)"/><ellipse cx="90" cy="${tired?62:56}" rx="10" ry="20" fill="${dk}" ${OL} transform="rotate(${tired?-20:-12} 90 50)"/>`;
    g+=`<ellipse cx="60" cy="54" rx="32" ry="29" fill="${c}" ${OL}/>`;
    if(type==="cachorro")g+=`<ellipse cx="72" cy="50" rx="10" ry="9" fill="${dk}" opacity=".6"/>`;
    if(type==="raposa")g+=`<path d="M30 60 q14 2 22 14 q-12 6 -20 -2z M90 60 q-14 2 -22 14 q12 6 20 -2z" fill="#fff"/>`;
    if(type==="dragao")g+=`<path d="M52 26 l4 -8 4 8 4 -8 4 8" fill="${dk}" ${OL}/><ellipse cx="60" cy="66" rx="15" ry="9" fill="${lt}"/><circle cx="55" cy="64" r="1.6" fill="${INK}"/><circle cx="65" cy="64" r="1.6" fill="${INK}"/>`;
    else g+=`<ellipse cx="60" cy="66" rx="13" ry="9" fill="${belly}"/><path d="M56 62 h8 l-4 4.5z" fill="${type==="cachorro"?INK:"#E0567F"}" stroke-linejoin="round"/>`;
    g+=faceParts(tired,53,INK,true);
    g+=tired?`<path d="M56 72 q4 -3 8 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`:`<path d="M53 68 q3.5 4 7 0 q3.5 4 7 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    if(type==="gatinha")g+=`<path d="M26 62h12M27 68h11M82 62h12M82 68h11" stroke="${INK}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`;
    if(type==="cachorro"&&!tired)g+=`<path d="M57 71 q3 9 6 0z" fill="#FF6B8B" stroke="${INK}" stroke-width="1.6"/>`;
    if(stage>=1&&!hat&&(type==="gatinha"||type==="coelho"))g+=hatSVG("laco",60,24);
    g+=bandana(84);
    g+=dumbbell(tired?90:96,tired?114:84);
    head={x:60,y:type==="coelho"?20:26};
  }
  if(stage>=4&&!hat)g+=hatSVG("coroa",head.x,head.y-4);
  if(hat)g+=hatSVG(hat,head.x,head.y);
  g+=zz(92,24);
  const aura=stage>=4?`<circle cx="60" cy="78" r="62" fill="${gold}" opacity=".16"/><circle cx="60" cy="78" r="48" fill="${gold}" opacity=".14"/>`:"";
  const sparks=stage>=4?`<g fill="${gold}"><path d="M10 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M108 16l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M110 92l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></g>`:"";
  return `<svg viewBox="-4 -6 128 148" role="img" aria-label="Seu personagem">${aura}${sparks}<ellipse class="shadow" cx="60" cy="137" rx="30" ry="4" fill="#000" opacity=".25"/><g class="bob">${back}${g}</g></svg>`;
}

/* ---------- ícones ---------- */
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const IC={
  hoje:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  trocas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
  doces:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M7 11h10l-5 10z"/><circle cx="9.5" cy="8" r="3.5"/><circle cx="14.5" cy="8" r="3.5"/></svg>',
  evolucao:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8L3.5 9.2l5.9-.9z"/></svg>',
  gym:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>',
  run:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4.5" r="2"/><path d="M8 21l3-6 3 2v4M6 12l3-4 4 1 2 3 3 1M11 15l1-5"/></svg>'
};
const FLAME='<svg viewBox="0 0 30 34"><path d="M15 1c2 6 9 9 9 18a9 9 0 0 1-18 0c0-5 3-7 4-11 1 3 2 4 4 5-1-5 0-9 1-12z" fill="#FF9A3C"/><path d="M15 14c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 3-7 0 2 1 3 2 3 0-2 0-4 0-6z" fill="#FFD84A"/></svg>';
const HEX='<svg viewBox="0 0 52 56"><path d="M26 2l22 12v28L26 54 4 42V14z" fill="#FFD84A" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M26 8l17 9.5" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/></svg>';
function chestSVG(open){
  return open
  ?`<svg viewBox="0 0 84 76"><path d="M10 34h64v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#B5652B"/><path d="M8 18 L76 6 L78 20 L10 32z" fill="#D98236"/><rect x="10" y="34" width="64" height="6" fill="#FFD84A"/><circle cx="42" cy="30" r="14" fill="#FFD84A" opacity=".5"/></svg>`
  :`<svg viewBox="0 0 84 76"><path d="M10 34h64v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#B5652B"/><path d="M10 34V24a10 10 0 0 1 10-10h44a10 10 0 0 1 10 10v10z" fill="#D98236"/><rect x="10" y="32" width="64" height="7" fill="#FFD84A"/><rect x="36" y="30" width="12" height="16" rx="3" fill="#FFD84A" stroke="#B8860B" stroke-width="2"/><rect x="24" y="14" width="6" height="58" fill="#FFD84A" opacity=".55"/><rect x="54" y="14" width="6" height="58" fill="#FFD84A" opacity=".55"/></svg>`;
}
function ringSVG(frac,col){
  const r=30,C=2*Math.PI*r;
  return `<svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="${r}" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.18)" stroke-width="7"/><circle cx="36" cy="36" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-frac)}" transform="rotate(-90 36 36)" style="transition:stroke-dashoffset .8s"/></svg>`;
}

/* ---------- efeitos ---------- */
let audioCtx=null;
function ding(kind){
  if(P().som===false)return;
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const notes=kind==="big"?[523,659,784,1047]:kind==="low"?[330]:[784,1175];
    notes.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="triangle";o.frequency.value=f;
      const t=audioCtx.currentTime+i*.09;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.18,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.35);
      o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.4)});
  }catch(e){}
}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
function floatXP(n,x,y){
  if(!n)return;
  const el=document.createElement("div");el.className="float";el.textContent="+"+n+" XP";
  el.style.left=x+"px";el.style.top=(y-20)+"px";document.body.appendChild(el);setTimeout(()=>el.remove(),1200);
}
let parts=[],fxRun=false;
function confetti(amount){
  if(reduced())return;
  const cv=$("#fx"),dpr=window.devicePixelRatio||1;cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;
  const cols=["#FF4F9A","#FFD84A","#3CDCF7","#3DE38D","#FF9A3C","#9C6BFF"];
  for(let i=0;i<(amount||120);i++)parts.push({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,
    s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length],life:1});
  if(!fxRun){fxRun=true;requestAnimationFrame(tick)}
}
function tick(){
  const cv=$("#fx"),ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
  parts.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life-=.008;
    ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);ctx.restore()});
  parts=parts.filter(p=>p.life>0&&p.y<innerHeight+40);
  if(parts.length)requestAnimationFrame(tick);else{fxRun=false;ctx.clearRect(0,0,innerWidth,innerHeight)}
}
let toastT;
function toast(msg){let el=$("#toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";document.body.appendChild(el)}
  el.textContent=msg;el.hidden=false;el.style.animation="none";void el.offsetWidth;el.style.animation="";clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true},2300)}

/* ---------- render ---------- */
let lastLevel=null, jumpNext=false, lastComplete=null;
function speech(A,i,tired){
  const t=todayKey(), y=dayInfo(addDays(t,-1)), h=new Date().getHours();
  if(tired)return "Senti sua falta... Marque uma refeição para eu acordar!";
  if(i.complete&&!i.d.bau)return "Dia cumprido! Abre o baú, vai!";
  if(i.complete)return A.streak>=3?`${A.streak} dias seguidos. Você está imparável!`:"Hoje foi seu. Orgulho!";
  if(P().criado<t&&!y.complete&&!y.logged)return "Ontem não deu. Regra de ouro: nunca falhar 2 dias seguidos!";
  if(!i.d.promessa)return "Bora fazer uma promessa pra hoje?";
  if(i.done===0)return h<12?"Bom dia! Primeira missão: café da manhã.":"Ainda dá tempo de fazer o dia valer!";
  if(i.total-i.done<=2)return "Falta pouquinho pra fechar o dia!";
  return ["Cada check me deixa mais forte!","Uma missão de cada vez.","Você não precisa de motivação, só do próximo passo."][i.done%3];
}
function render(){
  if(MODE==="pro"){renderPro();return}
  if(!S.profile&&!MODE&&!obStep){renderRole();return}
  $("#tabbar").hidden=!S.profile||!!obStep;
  if(!S.profile||obStep){renderOnboarding();return}
  const A=computeAll(), lv=levelOf(A.xp), st=stageOf(lv.L), tired=isTired();
  const ti=dayInfo(todayKey());
  const levelUp = lastLevel!==null&&lv.L>lastLevel;
  const justCompleted = lastComplete===false&&ti.complete;
  lastLevel=lv.L; lastComplete=ti.complete;
  const a=S.profile.avatar;
  let h=`<header class="hud">
    <div class="lv">${HEX}<span>${lv.L}</span><small>NÍVEL</small></div>
    <div class="mid"><div class="name"><b>${esc(a.nome||"Você")}</b><span>${lv.cur}/${lv.need} XP</span></div>
      <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${lv.need}" aria-valuenow="${lv.cur}"><i style="width:${Math.max(4,Math.round(lv.cur/lv.need*100))}%"></i></div></div>
    <div class="flame ${A.streak?"":"off"}" title="Dias seguidos">${FLAME}<b>${A.streak}</b></div>
  </header>`;
  if(view.tab==="hoje")h+=renderHoje(A,lv,st,tired);
  else if(view.tab==="treino")h+=renderTreino();
  else if(view.tab==="trocas")h+=renderTrocas();
  else if(view.tab==="doces")h+=renderDoces();
  else h+=renderEvolucao(A,lv,st,tired);
  $("#app").innerHTML=h;
  renderTabs();
  if(jumpNext){jumpNext=false;const s=$(".scene .av");if(s){s.classList.add("jump");setTimeout(()=>s.classList.remove("jump"),750)}}
  if(levelUp)setTimeout(()=>showLevelUp(lv.L,st),400);
  else if(justCompleted&&view.day===todayKey()){setTimeout(()=>{confetti(160);ding("big");toast("DIA CUMPRIDO! Seu baú foi liberado")},250)}
}
function renderTabs(){
  const t=[["hoje","Hoje"],["treino","Treino"],["trocas","Trocas"],["doces","Doces"],["evolucao","Evolução"]];
  $("#tabs").innerHTML=t.map(([id,l])=>`<button role="tab" aria-selected="${view.tab===id}" data-tab="${id}">${IC[id]}<span>${l}</span></button>`).join("");
}
function sceneHTML(A,lv,st,tired,i,bubble){
  const a=S.profile.avatar;
  return `<div class="scene bg-${a.bg||"noite"}">
    <span class="stage-tag">${STAGES[st][0]}</span>
    ${bubble?`<div class="bubble">${esc(bubble)}</div>`:""}
    ${i?`<div class="ring">${ringSVG(i.done/i.total,i.complete?"#3DE38D":"#FFD84A")}<b>${i.done}/${i.total}<small>MISSÕES</small></b></div>`:""}
    <div class="av ${tired?"tiredav":""}">${avatarSVG(a,st,tired)}</div></div>`;
}
function nowCard(i,k){
  if(k!==todayKey())return "";
  const d=i.d, meals=d.meals||{}, hr=new Date().getHours()+new Date().getMinutes()/60;
  const ms=DIETA(), win={};
  ms.forEach((m,i)=>{const t=horaNum(m.hora),nx=ms[i+1]?horaNum(ms[i+1].hora):25;win[m.id]=[t-.75,Math.min(nx-.5,t+3)]});
  const cur=ms.find(m=>hr>=win[m.id][0]&&hr<win[m.id][1]);
  const late=ms.filter(m=>m.main&&!meals[m.id]&&hr>=win[m.id][1]);
  const tr=treinoDo(k);
  if(cur&&!meals[cur.id]&&cur.main)
    return `<div class="now"><span class="k"><i></i>Agora · ${cur.hora}</span><h3>${cur.nome}</h3><p>${esc(cur.itens.join(" · "))}</p>
      <div class="acts"><button class="btn white" data-meal="${cur.id}" data-s="ok">Segui ✓</button><button class="btn glass" data-meal="${cur.id}" data-s="troca">Troquei</button></div></div>`;
  if(tr&&!d.treino&&hr>=17)
    return `<div class="now"><span class="k"><i></i>Hora do treino</span><h3>Treino de ${esc(tr)}</h3><p>Só ir já é 80% da vitória. Coloque a roupa e saia.</p>
      <div class="acts"><button class="btn white" data-x="w-start" data-wd="${new Date().getDay()}">Começar treino ▶</button><button class="btn glass" data-act="treino">Já treinei ✓</button></div></div>`;
  if(late.length)
    return `<div class="now"><span class="k"><i></i>Ficou pra trás</span><h3>${late[0].nome}</h3><p>Já comeu? Marque agora para não perder o XP.</p>
      <div class="acts"><button class="btn white" data-meal="${late[0].id}" data-s="ok">Segui ✓</button><button class="btn glass" data-meal="${late[0].id}" data-s="troca">Troquei</button><button class="btn glass" data-meal="${late[0].id}" data-s="pulei">Pulei</button></div></div>`;
  if(!d.cardio&&hr>=6)
    return `<div class="now"><span class="k"><i></i>Missão bônus</span><h3>Só 10 minutos de cardio</h3><p>Combine com você mesma: 10 minutos. Se quiser parar depois, pode.</p>
      <div class="acts"><button class="btn white" data-timer="10">Começar 10 min</button><button class="btn glass" data-timer="${cardioMeta()}">${cardioMeta()} min</button></div></div>`;
  if((d.agua||0)<aguaMeta())
    return `<div class="now"><span class="k"><i></i>Agora</span><h3>Beba um copo d’água</h3><p>Faltam ${aguaMeta()-(d.agua||0)} copos para a meta.</p>
      <div class="acts"><button class="btn white" data-act="agua+">+1 copo</button></div></div>`;
  return `<div class="now done"><span class="k"><i></i>Tudo em dia</span><h3>Você mandou bem hoje!</h3><p>Descanse e volte amanhã para manter a sequência.</p></div>`;
}
function promiseCard(i,k){
  const d=i.d;
  if(d.promessa){
    const p=PROMESSAS.find(x=>x.id===d.promessa);
    return `<div class="card promise-on ${i.kept?"ok":""}"><div class="seal">${i.kept?"✓":"✋"}</div><div><b>${i.kept?"Promessa cumprida!":"Minha promessa"}</b><span>${esc(p?p.t:"")} · ${i.kept?"+25 XP":"vale +25 XP"}</span></div></div>`;
  }
  if(k!==todayKey())return "";
  const opts=PROMESSAS.filter(p=>p.id!=="treino"||i.treinoDia);
  return `<div class="card promise stack"><h3>Promessa do dia</h3><div class="tip" style="margin-top:-4px">Escolha uma coisa e segure o botão. Promessas feitas são mais cumpridas.</div>
    <div class="popts">${opts.map(p=>`<button data-pick="${p.id}" class="${pickPromise===p.id?"on":""}">${esc(p.t)}</button>`).join("")}</div>
    <button class="hold" id="hold" ${pickPromise?"":"disabled style=\"opacity:.5\""}><i></i><span>${pickPromise?"Segure para prometer":"Escolha uma promessa"}</span></button></div>`;
}
let pickPromise=null;

function renderHoje(A,lv,st,tired){
  const k=view.day, t=todayKey(), i=dayInfo(k), d=i.d, p=S.profile;
  let h=updateBanner()+sceneHTML(A,lv,st,tired,i,speech(A,dayInfo(t),tired));
  h+=nowCard(i,k);
  /* dia */
  const minDay=addDays(t,-6), wk=weekKey(k); let wkH="";
  for(let n=0;n<7;n++){const x=addDays(wk,n),di=dayInfo(x);
    const cls=(di.complete)?"done":(A.status[x]==="shield"&&x<t)?"shield":di.logged?"part":"";
    wkH+=`<div>${WD[dateOf(x).getDay()]}<i class="${cls} ${x===k?"sel":""}">${cls==="done"?"✓":cls==="shield"?"◆":dateOf(x).getDate()}</i></div>`}
  h+=`<div class="daynav"><button data-act="prev" ${k<=minDay?"disabled":""} aria-label="Dia anterior">‹</button>
    <div class="d"><b>${k===t?"Hoje":k===addDays(t,-1)?"Ontem":fmtDay(k).split(",")[0]}</b><span>${fmtDay(k)} · ${i.xp} XP${A.shieldThisWeek?" · escudo pronto ◆":""}</span></div>
    <button data-act="next" ${k>=t?"disabled":""} aria-label="Próximo dia">›</button></div><div class="week">${wkH}</div>`;

  h+=`<div class="sec"><h2>Promessa</h2></div>`+promiseCard(i,k);

  /* treino e cardio */
  const tr=treinoDo(k), cd=d.cardio||0;
  let wc=0;for(let n=0;n<7;n++){if((S.days[addDays(weekKey(k),n)]||{}).cardio)wc++}
  const wcMeta=p.cardioSemana||3;
  h+=`<div class="sec"><h2>Treino</h2><small>${i.complete?"Dia cumprido ✓":"Feche: "+i.need+" refeições"+(tr?" + treino":"")}</small></div><div class="card">
    <div class="q ${d.treino?"done":""}"><button class="chk" data-act="treino" aria-label="Marcar treino">${CHECK}</button>
      <div class="t"><b>${tr?"Treino de "+esc(tr):"Dia de descanso"}</b><p>${tr?(d.tlog?`${d.tlog.ex.length} exercícios · ${d.tlog.dur} min`:`${(planDay(dateOf(k).getDay())||{ex:[]}).ex.length} exercícios com vídeo`):"Treinou mesmo assim? Marque!"}</p></div><div class="side">${tr&&!d.treino&&k===todayKey()?`<button class="btn pink sm" data-x="w-start" data-wd="${dateOf(k).getDay()}">${W&&W.k===k?"Continuar":"Treinar"} ▶</button>`:`<span class="xp">+${tr?30:15}</span>`}</div></div>
    <div class="q ${cd?"done":""}"><div class="ic run">${IC.run}</div>
      <div class="t"><b>Cardio${cd?` · ${cd} min`:""}</b><p>Meta ${cardioMeta()} min · semana ${wc}/${wcMeta}</p></div>
      <div class="side">${cd?`<span class="xp">+${cd>=cardioMeta()?20:10}</span><button class="mini" data-act="cardio-undo">desfazer</button>`:`<button class="btn cyan sm" data-timer="${cardioMeta()}">Iniciar</button><button class="mini" data-act="cardio-manual">já fiz</button>`}</div></div>
  </div>`;

  /* refeições */
  h+=`<div class="sec"><h2>Refeições</h2><small>${i.good}/${i.mains} principais</small></div><div class="card">`;
  DIETA().forEach(m=>{
    const r=(d.meals||{})[m.id];
    let cls="",res="";
    if(r){
      if(r.s==="ok"){cls="done";res="Segui a dieta"}
      else if(r.s==="troca"){cls=r.v==="ok"?"done":r.v==="mod"?"mod":"bad";res="Troquei: "+esc(r.o)}
      else {cls="skip";res=m.main?"Pulei":"Não comi (tudo bem)"}
    }
    const xp=mealXP(r,m.main);
    h+=`<div class="q ${cls}"><button class="chk" ${r?`data-unmeal="${m.id}" aria-label="Desmarcar"`:`data-meal="${m.id}" data-s="ok" aria-label="Segui ${esc(m.nome)}"`}>${r&&r.s==="pulei"?"":CHECK}</button>
      <div class="t"><div class="h"><em>${m.hora}</em></div><b>${m.nome}</b>${r?`<p class="res">${res}</p>`:`<p>${esc(m.itens.join(" · "))}</p>`}</div>
      <div class="side">${r?(xp?`<span class="xp">+${xp}</span>`:""):`<button class="mini swap" data-meal="${m.id}" data-s="troca">troquei</button><button class="mini" data-meal="${m.id}" data-s="pulei">${m.main?"pulei":"não comi"}</button>`}</div></div>`;
  });
  h+=`</div>`;

  /* água */
  const am=aguaMeta(), ag=d.agua||0, fr=Math.min(1,ag/am);
  const wy=18+92*(1-fr);
  h+=`<div class="sec"><h2>Água</h2><small>${ag>=am?"meta batida · +10 XP":"toque na garrafa"}</small></div>
    <div class="card water"><button class="bottle" data-act="agua+" aria-label="Adicionar um copo">
      <svg viewBox="0 0 74 120"><defs><clipPath id="bt"><path d="M26 4h22v12l10 10v84a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6V26l10-10z"/></clipPath></defs>
      <path d="M26 4h22v12l10 10v84a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6V26l10-10z" fill="#0d0620" stroke="#3CDCF7" stroke-width="3"/>
      <g clip-path="url(#bt)"><rect x="0" y="${wy}" width="74" height="120" fill="#3CDCF7" style="transition:y .5s"/><path d="M0 ${wy} q9 -5 18 0 t18 0 t18 0 t18 0 v6 H0z" fill="#8BEBFB"/></g>
      <rect x="22" y="40" width="5" height="50" rx="2.5" fill="#fff" opacity=".25"/></svg></button>
      <div class="t"><b>${ag}<small> / ${am} copos</small></b><div class="drops">${Array.from({length:am},(_,n)=>`<i class="${n<ag?"on":""}"></i>`).join("")}</div>
      <div style="display:flex;gap:8px"><button class="btn cyan sm" data-act="agua+">+1 copo</button>${ag?`<button class="btn sm" data-act="agua-">−1</button>`:""}</div></div></div>`;

  /* baú */
  const ready=i.complete&&!d.bau;
  h+=`<div class="sec"><h2>Baú do dia</h2></div><div class="card chest ${ready?"ready":""}"><div class="box">${chestSVG(!!d.bau)}</div>
    <div class="t">${d.bau?`<b>Baú aberto</b><span>${d.bau==="xp"?"Você ganhou +40 XP":"Você ganhou: "+esc((ITEMS.find(x=>x.id===d.bau)||{}).nome||"")}</span>`
      :ready?`<b>Seu baú está pronto!</b><button class="btn yellow" data-act="bau">Abrir baú</button>`
      :`<b>Trancado</b><span>Cumpra o dia (${i.need} refeições${tr?" + treino":""}) para abrir e ganhar um item para seu avatar.</span>`}</div></div>`;
  return h;
}

function renderTrocas(){
  const recent=[];
  Object.keys(S.days).sort().reverse().forEach(k=>{Object.entries((S.days[k].meals)||{}).forEach(([id,m])=>{if(m.s==="troca"&&recent.length<12)recent.push({k,id,m})})});
  let h=`<div class="sec"><h2>Posso trocar?</h2></div>
    <div class="card stack"><p style="margin:0;font-size:14px">Diga o que vai comer no lugar. Eu digo se pode e, se não puder, o que comer.</p>
      <label class="f" for="tq-meal">REFEIÇÃO<select id="tq-meal">${DIETA().map(m=>`<option value="${m.id}">${m.hora} · ${m.nome}</option>`).join("")}</select></label>
      <button class="btn pink big full" data-act="open-check">Verificar uma troca</button></div>
    <div class="sec"><h2>Trocas que sempre funcionam</h2></div>
    <div class="card stack" style="font-size:14px">
      <div><b style="color:var(--yellow)">Sem ovo no café?</b> Troque os 2 ovos por 1 iogurte natural, 2 fatias de queijo branco, ou peito de peru com requeijão light.</div>
      <div><b style="color:var(--yellow)">Arroz</b> pode virar batata-doce, mandioca, cuscuz ou macarrão, na mesma quantidade.</div>
      <div><b style="color:var(--yellow)">Frango</b> pode virar carne magra, peixe, atum, sardinha ou 2 ovos.</div>
      <div><b style="color:var(--yellow)">Pão francês</b> pode virar tapioca pequena, cuscuz ou 2 torradas, sempre com uma proteína junto.</div></div>`;
  if(recent.length)h+=`<div class="sec"><h2>Suas últimas trocas</h2></div><div class="card">`+recent.map(r=>{const m=DIETA().find(x=>x.id===r.id);
    return `<div class="sweet"><div><b>${esc(r.m.o)}</b><small>${fmtDay(r.k)} · ${m?m.nome:""}</small></div><span class="kcal ${r.m.v==="ok"?"low":r.m.v==="no"?"high":"mid"}">${VERD[r.m.v].t}</span></div>`}).join("")+`</div>`;
  return h;
}

function renderDoces(){
  const d=S.days[todayKey()]||{};
  return `<div class="sec"><h2>Vontade de doce</h2></div>
    <button class="sos ${d.doce?"won":""}" data-act="sos"><b>${d.doce?"Você venceu hoje!":"SOS Doce"}</b><span>${d.doce?"Vitória registrada: +15 XP. Bateu de novo? Toque para outra rodada.":"Toque quando a vontade apertar. Vamos passar por ela juntas em 10 minutos."}</span></button>
    <div class="card" style="margin-top:12px"><ol class="tips"><li>Beba um copo grande de água.</li><li>Espere 10 minutos respirando (o SOS faz isso com você).</li><li>Ainda quer? Escolha um doce verde, numa porção só, sem culpa.</li></ol></div>
    <div class="sec"><h2>Pode comprar</h2><small>calorias aproximadas</small></div>
    <div class="card">${SWEETS_OK.map(s=>`<div class="sweet"><div><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div><span class="kcal low">${s[2]}</span></div>`).join("")}</div>
    <div class="sec"><h2>Compare antes de pegar</h2><small>kcal</small></div>
    <div class="card">${SWEETS_BAD.map(s=>`<div class="sweet"><div><b>${esc(s[0])}</b>${s[1]?`<small>${esc(s[1])}</small>`:""}</div><span class="kcal high">${s[2]}</span></div>`).join("")}</div>
    ${NO_AI?"":`<div class="sec"><h2>Pergunte à IA</h2></div>
    <div class="card stack"><label class="f" for="sw-q">O QUE VOCÊ TEM EM CASA?<input type="text" id="sw-q" placeholder="ex.: banana, leite, cacau, aveia"></label>
      <button class="btn pink full" data-act="ai-sweet">Me dê ideias de doce leve</button><div id="sw-out" hidden class="ai-box"></div></div>`}`;
}

function renderEvolucao(A,lv,st,tired){
  const p=S.profile, a=p.avatar, own=owned();
  let h=sceneHTML(A,lv,st,tired,null,`${A.xp} XP no total${st<4?`. Próxima fase no nível ${STAGES[st+1][1]}!`:". Você é lenda!"}`);
  h+=`<div class="sec"><h2>Fases</h2></div><div class="card"><div class="stages">${STAGES.map((s,i)=>`<div class="${i<=st?"on":""}">${avatarSVG(a,i,false,{noHat:true})}<span>${s[0]}</span><span>nv ${s[1]}</span></div>`).join("")}</div></div>`;
  h+=`<div class="sec"><h2>Guarda-roupa</h2><small>${own.size}/${ITEMS.length} · ganhe nos baús</small></div><div class="card stack">
    <div class="wardrobe">${[{id:"",tipo:"hat",nome:"Nada"}].concat(ITEMS.filter(x=>x.tipo==="hat")).map(it=>{const has=!it.id||own.has(it.id);
      return `<button data-wear="${it.id}" data-kind="hat" class="${(a.hat||"")===it.id?"on":""} ${has?"":"locked"}" ${has?"":"disabled"} aria-label="${it.nome}"><svg viewBox="0 0 120 70">${it.id?hatSVG(it.id,60,36):'<path d="M45 35h30" stroke="#8676B3" stroke-width="4" stroke-linecap="round"/>'}</svg>${has?it.nome:"?"}</button>`}).join("")}</div>
    <div class="wardrobe">${[{id:"",tipo:"bg",nome:"Noite"}].concat(ITEMS.filter(x=>x.tipo==="bg")).map(it=>{const has=!it.id||own.has(it.id);
      return `<button data-wear="${it.id}" data-kind="bg" class="${(a.bg||"")===it.id?"on":""} ${has?"":"locked"}" ${has?"":"disabled"} aria-label="${it.nome}"><span class="sw bg-${it.id||"noite"}"></span>${has?it.nome:"?"}</button>`}).join("")}</div></div>`;
  h+=`<div class="sec"><h2>Números</h2></div><div class="stats">
    <div><b>${A.streak}</b><span>sequência</span></div><div><b>${A.best}</b><span>recorde</span></div><div><b>${A.perfeitos}</b><span>dias cumpridos</span></div>
    <div><b>${A.treinos}</b><span>treinos</span></div><div><b>${A.cardioMin}</b><span>min cardio</span></div><div><b>${A.doces}</b><span>doces vencidos</span></div></div>`;
  /* peso */
  const ws=(p.pesos||[]).slice().sort((x,y)=>x.d<y.d?-1:1), ini=num(p.pesoInicial), meta=num(p.pesoMeta), atual=ws.length?ws[ws.length-1].kg:ini;
  h+=`<div class="sec"><h2>Peso</h2><small>${meta?"meta "+kg(meta)+" kg":""}</small></div><div class="card stack">`;
  if(ini&&atual!=null){const perdeu=ini-atual, prog=meta&&ini>meta?Math.max(0,Math.min(1,(ini-atual)/(ini-meta))):0;
    h+=`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-family:var(--f-game);font-weight:400;font-size:30px">${kg(atual)} kg</b>
      <span style="color:${perdeu>0?"var(--green)":"var(--muted)"};font-weight:900">${perdeu>0?"−"+kg(perdeu)+" kg":"início "+kg(ini)+" kg"}</span></div>`;
    if(meta)h+=`<div class="xpbar"><i style="width:${Math.max(3,Math.round(prog*100))}%;background:linear-gradient(90deg,var(--cyan),var(--green))"></i></div>`}
  if(ws.length>=2)h+=weightChart(ws,meta);
  h+=`<div style="display:flex;gap:8px"><input type="number" id="w-kg" inputmode="decimal" step="0.1" placeholder="Peso de hoje (kg)" aria-label="Peso de hoje em kg"><button class="btn pink" data-act="add-w">Salvar</button></div>`;
  if(ws.length)h+=`<div class="wlist">${ws.slice(-6).reverse().map(w=>`<span>${dateOf(w.d).getDate()} ${MES[dateOf(w.d).getMonth()]}: ${kg(w.kg)}</span>`).join("")}</div>`;
  h+=`<div class="tip">Pese uma vez por semana, no mesmo dia, de manhã em jejum.</div></div>`;
  /* medalhas */
  const lost=ini&&atual?ini-atual:0;
  const M=[["1º dia",A.perfeitos>=1,"1"],["3 seguidos",A.best>=3,"3"],["7 seguidos",A.best>=7,"7"],["30 seguidos",A.best>=30,"30"],
    ["10 treinos",A.treinos>=10,"10"],["5 cardios",A.cardios>=5,"5"],["20 cardios",A.cardios>=20,"20"],["Troca esperta",A.trocasBoas>=1,"↔"],
    ["Doce vencido",A.doces>=1,"SOS"],["5 promessas",A.promessas>=5,"✋"],["−2 kg",lost>=2,"2"],["−5 kg",lost>=5,"5"]];
  h+=`<div class="sec"><h2>Medalhas</h2><small>${M.filter(m=>m[1]).length}/${M.length}</small></div><div class="medals">${M.map(m=>`<div class="medal ${m[1]?"on":""}"><i>${m[2]}</i>${m[0]}</div>`).join("")}</div>`;
  h+=`<div class="sec"><h2>Ajustes</h2></div><div class="card stack">
    <button class="btn full" data-act="edit-diet">Minha dieta e horários</button>
    <button class="btn full" data-act="reminders">${window.FFNative?"Notificações":"Lembretes no celular"}</button>
    <button class="btn full" data-act="edit-avatar">Trocar personagem</button>
    <button class="btn full" data-act="edit-plan">Treinos e metas</button>
    <button class="btn full" data-x="to-pro">Área do professor</button>
    <button class="btn full" data-act="backup">Backup dos dados</button>
    ${window.FFNative?`<button class="btn full" data-act="check-update">Procurar atualização</button>`:""}
    <button class="btn full" data-act="som">Som: ${p.som===false?"desligado":"ligado"}</button>
    <button class="btn ghost full" data-act="reset" style="color:var(--red)">Apagar todos os dados</button></div>
    ${window.FFNative&&window.FF_BUILD?`<p class="note" style="margin-bottom:-10px">Versão 1.${window.FF_BUILD}</p>`:""}
    <p class="note">XP: refeição +10 · treino +30 · cardio na meta +20 · água +10 · dia cumprido +20 · promessa +25 · doce vencido +15 · baú.<br>Um escudo por semana protege sua sequência num dia ruim.</p>`;
  return h;
}
function weightChart(ws,meta){
  const W=320,H=130,Pd={l:34,r:10,t:10,b:20};
  const vals=ws.map(w=>w.kg).concat(meta?[meta]:[]);
  let lo=Math.min(...vals),hi=Math.max(...vals); if(hi-lo<2){lo-=1;hi+=1} lo=Math.floor(lo);hi=Math.ceil(hi);
  const x=i=>Pd.l+(W-Pd.l-Pd.r)*(i/(ws.length-1)), y=v=>Pd.t+(H-Pd.t-Pd.b)*(1-(v-lo)/(hi-lo));
  const pts=ws.map((w,i)=>`${x(i).toFixed(1)},${y(w.kg).toFixed(1)}`).join(" "), last=ws[ws.length-1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico do peso">
    <line x1="${Pd.l}" x2="${W-Pd.r}" y1="${y(hi)}" y2="${y(hi)}" stroke="#43307F"/><line x1="${Pd.l}" x2="${W-Pd.r}" y1="${y(lo)}" y2="${y(lo)}" stroke="#43307F"/>
    <text x="${Pd.l-6}" y="${y(hi)+4}" text-anchor="end" font-size="10" fill="#BBA9E0">${hi}</text><text x="${Pd.l-6}" y="${y(lo)+4}" text-anchor="end" font-size="10" fill="#BBA9E0">${lo}</text>
    ${meta?`<line x1="${Pd.l}" x2="${W-Pd.r}" y1="${y(meta)}" y2="${y(meta)}" stroke="#3DE38D" stroke-dasharray="4 4"/><text x="${W-Pd.r}" y="${y(meta)-4}" text-anchor="end" font-size="10" fill="#3DE38D">meta</text>`:""}
    <polygon points="${x(0)},${H-Pd.b} ${pts} ${x(ws.length-1)},${H-Pd.b}" fill="#FF4F9A" opacity=".18"/>
    <polyline points="${pts}" fill="none" stroke="#FF4F9A" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${x(ws.length-1)}" cy="${y(last.kg)}" r="5" fill="#FFD84A"/>
    <text x="${Pd.l}" y="${H-5}" font-size="10" fill="#BBA9E0">${dateOf(ws[0].d).getDate()} ${MES[dateOf(ws[0].d).getMonth()]}</text>
    <text x="${W-Pd.r}" y="${H-5}" text-anchor="end" font-size="10" fill="#BBA9E0">${dateOf(last.d).getDate()} ${MES[dateOf(last.d).getMonth()]}</text></svg>`;
}

/* ---------- camadas ---------- */
function openSheet(html){$("#layer").innerHTML=`<div class="sheet-bg" data-close="1"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;const f=$("#layer input[type=text],#layer select");if(f)setTimeout(()=>f.focus(),60)}
function openFull(html){$("#layer").innerHTML=`<div class="fs" role="dialog" aria-modal="true"><div class="inner">${html}</div></div>`}
function closeSheet(){$("#layer").innerHTML="";stopTimers()}
function showLevelUp(L,st){
  const newStage=STAGES[st][1]===L;
  openFull(`<div class="glow">${avatarSVG(S.profile.avatar,st,false)}</div><h2 style="color:var(--yellow)">NÍVEL ${L}!</h2>
    <p>${newStage?`Nova fase desbloqueada: <b style="color:var(--ink)">${STAGES[st][0]}</b>. Seu personagem evoluiu!`:"Você está ficando mais forte a cada dia."}</p>
    <button class="btn yellow big" data-close="1">Continuar</button>`);
  $(".fs .glow svg").style.cssText="width:170px;height:198px";
  confetti(200);ding("big");buzz([30,40,30]);
}

/* ---------- timers (cardio e SOS) ---------- */
let tmr=null, tmrInt=null, wake=null;
function stopTimers(){clearInterval(tmrInt);tmrInt=null;tmr=null;try{wake&&wake.release()}catch(e){}wake=null;try{localStorage.removeItem("focofit.timer")}catch(e){}}
async function keepAwake(){try{if(navigator.wakeLock)wake=await navigator.wakeLock.request("screen")}catch(e){}}
function startCardio(mins,resume){
  tmr=resume||{kind:"cardio",mins,start:Date.now(),acc:0,paused:false,day:view.day};
  try{localStorage.setItem("focofit.timer",JSON.stringify(tmr))}catch(e){}
  const st=stageOf(levelOf(computeAll().xp).L);
  openFull(`<div class="runner running">${avatarSVG(S.profile.avatar,st,false)}</div>
    <div class="timer"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="104" fill="none" stroke="#2E1F5E" stroke-width="16"/><circle id="tm-ring" cx="120" cy="120" r="104" fill="none" stroke="#3CDCF7" stroke-width="16" stroke-linecap="round" stroke-dasharray="${2*Math.PI*104}" stroke-dashoffset="${2*Math.PI*104}"/></svg>
      <div class="c"><b id="tm-left">${pad(tmr.mins)}:00</b><span>cardio · ${tmr.mins} min</span></div></div>
    <p id="tm-msg">Começou! O mais difícil já foi.</p>
    <div class="row-end" style="justify-content:center"><button class="btn big" data-act="tm-pause" id="tm-pause">Pausar</button><button class="btn cyan big" data-act="tm-stop">Terminar</button></div>`);
  keepAwake();
  clearInterval(tmrInt);tmrInt=setInterval(tickCardio,250);tickCardio();
}
function cardioElapsed(){if(!tmr)return 0;return tmr.acc+(tmr.paused?0:Date.now()-tmr.start)}
function tickCardio(){
  if(!tmr)return; const tot=tmr.mins*60000, el=Math.min(tot,cardioElapsed()), left=Math.ceil((tot-el)/1000);
  const ring=$("#tm-ring"); if(!ring){clearInterval(tmrInt);return}
  const C=2*Math.PI*104; ring.setAttribute("stroke-dashoffset",C*(1-el/tot));
  $("#tm-left").textContent=pad(Math.floor(left/60))+":"+pad(left%60);
  const f=el/tot, msg=$("#tm-msg");
  msg.textContent=f<.25?"Começou! O mais difícil já foi.":f<.5?"Ritmo bom. Respira e segue.":f<.75?"Passou da metade!":f<1?"Reta final, você consegue!":"";
  const rn=$(".runner"); if(rn)rn.classList.toggle("running",!tmr.paused);
  if(el>=tot)finishCardio(tmr.mins);
}
function finishCardio(minsDone){
  const k=tmr?tmr.day:view.day; stopTimers();
  const before=dayInfo(k).xp;
  if(minsDone>=1){const d=day(k);d.cardio=(d.cardio||0)+minsDone;saveDay(k)}
  const gained=dayInfo(k).xp-before;
  if(minsDone>=1){
    openFull(`<div class="glow" style="width:150px">${chestSVG(true).replace("<svg","<svg style=\"width:150px;height:130px\"")}</div><h2>${minsDone} min de cardio!</h2><p>${gained?`+${gained} XP.`:""} Você cumpriu o que combinou com você mesma.</p><button class="btn cyan big" data-close="1">Fechar</button>`);
    confetti(150);ding("big");buzz([40,40,40]);jumpNext=true;render();
  } else {closeSheet();toast("Tudo bem. Amanhã tem mais.")}
}
function startSOS(){
  tmr={kind:"sos",start:Date.now(),mins:10};
  openFull(`<h2>Respira comigo</h2><div class="breath" id="br">Inspire</div>
    <div style="font-family:var(--f-game);font-size:36px;font-variant-numeric:tabular-nums" id="sos-left">10:00</div>
    <p>A vontade de doce costuma passar em 10 a 15 minutos. Beba água enquanto isso.</p>
    <div class="row-end" style="justify-content:center"><button class="btn green big" data-act="sos-win">A vontade passou!</button></div>
    <button class="btn ghost" data-act="sos-eat">Ainda quero, me mostre opções leves</button>`);
  keepAwake();
  let ph=0; clearInterval(tmrInt);
  tmrInt=setInterval(()=>{if(!tmr)return;const el=Date.now()-tmr.start,left=Math.max(0,600-Math.floor(el/1000));
    const L=$("#sos-left");if(!L)return;L.textContent=pad(Math.floor(left/60))+":"+pad(left%60);
    const b=$("#br");const p=Math.floor(el/4000)%2;if(p!==ph){ph=p;b.textContent=p?"Expire":"Inspire"}
    if(left===0){L.textContent="Pronto!"}},250);
}

/* ---------- onboarding, personagem e dieta ---------- */
let draft=null, obStep=0, ob=null, ds={};
function newOb(){return {objetivo:"emagrecer",peso:"",meta:"",altura:"",idade:"",acordar:"06:00",treinoHora:"18:00",dias:[1,2,3,4,5],nomes:{...DEFAULT_TREINOS},restr:""}}
function stepDots(){return `<div class="steps">${[1,2,3,4].map(n=>`<i class="${n<=obStep?"on":""}"></i>`).join("")}</div>`}
function renderOnboarding(){
  $("#tabs").innerHTML="";
  if(!obStep)obStep=1;
  draft=draft||{type:"atleta",color:TYPE_COLOR.atleta,skin:1,hair:HAIRS[0],hairStyle:"rabo",nome:""};
  ob=ob||newOb();
  let h=stepDots();
  if(obStep===1){
    h+=`<div class="stack"><h1 style="font-size:32px">Bem-vinda ao <span style="color:var(--pink)">Foco Fit</span></h1>
      ${pendingPlan?`<div class="pnote">Seu plano do prof. ${esc((pendingPlan.pf||[])[0]||"")} já está guardado. Escolha seu personagem e ele entra pronto.</div>`:""}
      <p style="margin:0;color:var(--muted)">Cada refeição, treino, cardio e copo d’água vira XP. Seu personagem sobe de nível, evolui em 5 fases e ganha itens nos baús.</p>
      <div class="scene ob-scene bg-noite"><div class="av" id="ob-av">${avatarSVG(draft,2,false)}</div></div>
      ${avatarForm()}
      <button class="btn pink big full" data-act="ob-next">Continuar</button>${pendingPlan?"":`<button class="btn ghost full" data-x="role-back">Voltar</button>`}</div>`;
  } else if(obStep===2){
    const dias=[1,2,3,4,5,6,0];
    h+=`<div class="stack"><h1 style="font-size:28px">Seus objetivos</h1><p style="margin:0;color:var(--muted)">Isso ajuda a montar sua dieta e seus lembretes.</p>
      <div class="card stack"><div class="f">QUAL SEU OBJETIVO?<div class="seg">${OBJETIVOS.map(([id,l])=>`<button data-obj="${id}" class="${ob.objetivo===id?"on":""}">${l}</button>`).join("")}</div></div>
        <div class="grid2"><label class="f" for="ob-peso">PESO ATUAL (KG)<input type="number" id="ob-peso" inputmode="decimal" step="0.1" value="${esc(ob.peso)}"></label>
        <label class="f" for="ob-meta">META (KG)<input type="number" id="ob-meta" inputmode="decimal" step="0.1" value="${esc(ob.meta)}"></label>
        <label class="f" for="ob-alt">ALTURA (CM)<input type="number" id="ob-alt" inputmode="numeric" value="${esc(ob.altura)}"></label>
        <label class="f" for="ob-idade">IDADE<input type="number" id="ob-idade" inputmode="numeric" value="${esc(ob.idade)}"></label></div></div>
      <div class="card stack"><div class="grid2"><label class="f" for="ob-acordar">ACORDO ÀS<input type="time" id="ob-acordar" value="${esc(ob.acordar)}"></label>
        <label class="f" for="ob-treinoh">TREINO ÀS<input type="time" id="ob-treinoh" value="${esc(ob.treinoHora)}"></label></div>
        <div class="f">DIAS DE TREINO<div class="daychips">${dias.map(i=>`<button data-dia="${i}" class="${ob.dias.includes(i)?"on":""}">${WD[i]}</button>`).join("")}</div></div>
        ${ob.dias.length?`<div class="stack" style="gap:6px">${dias.filter(i=>ob.dias.includes(i)).map(i=>`<label class="f row" for="ob-tn-${i}"><span>${WD[i].toUpperCase()}</span><input type="text" id="ob-tn-${i}" placeholder="ex.: Pernas" value="${esc(ob.nomes[i]||"")}"></label>`).join("")}</div>`:""}</div>
      <div class="row-end"><button class="btn ghost" data-act="ob-back">Voltar</button><button class="btn pink big" data-act="ob-next">Continuar</button></div></div>`;
  } else if(obStep===3){
    h+=`<div class="stack"><h1 style="font-size:28px">Sua dieta</h1><p style="margin:0;color:var(--muted)">Traga a dieta que você já tem, ou deixe que eu monte uma pelos seus objetivos.</p>
      <div id="ds-wrap">${dietSetupHTML(true)}</div>
      <div class="row-end"><button class="btn ghost" data-act="ob-back">Voltar</button></div></div>`;
  } else {
    h+=`<div class="stack"><h1 style="font-size:28px">${window.FFNative?"Notificações no horário":"Lembretes no horário"}</h1><p style="margin:0;color:var(--muted)">${window.FFNative?"Eu aviso na hora de cada refeição, do treino e da água. Toque no aviso e registre em 1 segundo.":"Para o celular avisar na hora de cada refeição, crie os alarmes no seu calendário. Leva 1 minuto e você pode fazer depois em Evolução."}</p>
      <div class="card">${remindersHTML()}</div>
      <button class="btn pink big full" data-act="ob-finish" style="font-size:18px;padding:16px">Começar a jornada</button></div>`;
  }
  $("#app").innerHTML=h;
}
function obCollect(){
  const v=id=>{const e=$("#"+id);return e?e.value:null};
  if(obStep===2){ob.peso=v("ob-peso");ob.meta=v("ob-meta");ob.altura=v("ob-alt");ob.idade=v("ob-idade");ob.acordar=v("ob-acordar")||"06:00";ob.treinoHora=v("ob-treinoh")||"18:00";
    ob.dias.forEach(i=>{const x=v("ob-tn-"+i);if(x!==null)ob.nomes[i]=x})}
  if(obStep===1){const n=$("#av-nome");if(n)draft.nome=n.value}
}
function avatarForm(){
  return `<div class="card stack" id="avform"><h2 style="font-size:20px">Escolha seu personagem</h2>
    <div class="pick">${TYPES.map(([t,l])=>`<button data-type="${t}" class="${draft.type===t?"on":""}">${avatarSVG({...draft,type:t,color:draft.type===t?draft.color:TYPE_COLOR[t],hat:null},1,false)}<span>${l}</span></button>`).join("")}</div>
    <div class="f">${draft.type==="atleta"?"COR DA ROUPA":draft.type==="planta"?"COR DO VASO":draft.type==="robo"?"COR DA LATARIA":"COR DO PELO"}<div class="swatches">${COLORS.map(c=>`<button data-color="${c}" class="${draft.color===c?"on":""}" style="background:${c}" aria-label="cor"></button>`).join("")}</div></div>
    ${draft.type==="atleta"?`<div class="f">PENTEADO<div class="seg">${HAIR_STYLES.map(([id,l])=>`<button data-hs="${id}" class="${(draft.hairStyle||"rabo")===id?"on":""}">${l}</button>`).join("")}</div></div>
      <div class="f">COR DO CABELO<div class="swatches">${HAIRS.map(c=>`<button data-hair="${c}" class="${draft.hair===c?"on":""}" style="background:${c}" aria-label="cabelo"></button>`).join("")}</div></div>
      <div class="f">TOM DE PELE<div class="swatches">${SKINS.map((c,i)=>`<button data-skin="${i}" class="${draft.skin===i?"on":""}" style="background:${c}" aria-label="tom ${i+1}"></button>`).join("")}</div></div>`:""}
    <label class="f" for="av-nome">NOME DO PERSONAGEM<input type="text" id="av-nome" maxlength="16" placeholder="ex.: Maria Fit" value="${esc(draft.nome)}"></label></div>`;
}
function refreshAvatarForm(){const n=$("#av-nome");if(n)draft.nome=n.value;const el=$("#avform");if(el)el.outerHTML=avatarForm();const o=$("#ob-av");if(o)o.innerHTML=avatarSVG(draft,2,false)}

/* configuração da dieta: escolher modo, processar, revisar */
function dietSetupHTML(isOb){
  if(ds.busy)return `<div class="card stack" style="justify-items:center;text-align:center;padding:24px"><div class="runner running">${avatarSVG(draft||S.profile.avatar,2,false)}</div><h3 style="font-size:20px">${esc(ds.busy)}</h3><div class="tip">Isso pode levar até um minuto.</div></div>`;
  if(ds.result)return dietReviewHTML(isOb);
  const modes=[["texto","Digitar ou colar","Cole a dieta do nutricionista ou do ChatGPT"],["foto","Foto ou arquivo","Envie um print, foto ou .txt da dieta"],["gerar","Não tenho dieta","Monto uma pelos seus objetivos"]];
  const ms=NO_AI?modes.filter(m=>m[0]!=="foto").map(m=>m[0]==="gerar"?[m[0],m[1],"Uso um modelo pelo seu objetivo"]:m):modes;
  let h=`<div class="modes">${ms.map(([id,t,s])=>`<button data-dsmode="${id}" class="${ds.mode===id?"on":""}"><b>${t}</b><span>${s}</span></button>`).join("")}</div>`;
  if(ds.mode==="texto")h+=`<div class="card stack"><label class="f" for="ds-text">COLE OU DIGITE SUA DIETA<textarea id="ds-text" rows="9" placeholder="06h20 — Café da manhã&#10;- 1 pão francês&#10;- 2 ovos&#10;11h30 — Almoço&#10;- 3 colheres de arroz ...">${esc(ds.text||"")}</textarea></label>
    <button class="btn pink big full" data-act="ds-run">Ler minha dieta</button></div>`;
  if(ds.mode==="foto")h+=`<div class="card stack"><label class="f" for="ds-file">ESCOLHA A FOTO OU O ARQUIVO<input type="file" id="ds-file" accept="image/png,image/jpeg,image/webp,.txt,text/plain"></label>
    <div class="tip">Funciona com print ou foto nítida da dieta, e arquivos .txt. Para PDF, tire um print da tela.</div>
    <button class="btn pink big full" data-act="ds-run">Ler arquivo</button></div>`;
  if(ds.mode==="gerar"){const o=ob||newOb();h+=`<div class="card stack"><div class="tip">${NO_AI?"Vou usar um modelo de dieta simples e barata para":"Vou montar uma dieta simples e barata para"} <b style="color:var(--ink)">${esc((OBJETIVOS.find(x=>x[0]===o.objetivo)||[,""])[1].toLowerCase())}</b>, acordando às ${esc(o.acordar)} e treinando às ${esc(o.treinoHora)}.</div>
    <label class="f" for="ds-restr">ALGO QUE VOCÊ NÃO COME OU NÃO GOSTA?<input type="text" id="ds-restr" placeholder="ex.: não consigo comer ovo de manhã" value="${esc(o.restr||"")}"></label>
    ${NO_AI?`<button class="btn pink big full" data-act="ds-template">Montar minha dieta</button>`:`<button class="btn pink big full" data-act="ds-run">Montar minha dieta</button>
    <button class="btn ghost full" data-act="ds-template">Prefiro um modelo pronto, sem IA</button>`}
    <div class="tip">É uma sugestão para começar e não substitui um nutricionista.</div></div>`}
  if(ds.err)h+=`<div class="verdict no" style="margin-top:10px"><p>${esc(ds.err)}</p></div>`;
  return h;
}
function dietReviewHTML(isOb){
  return `<div class="card stack"><h3 style="font-size:20px">Confira sua dieta</h3>${ds.nota?`<div class="tip">${esc(ds.nota)}</div>`:""}
    <div class="tip">Ajuste horários e itens. Cada linha é um item. Refeições opcionais não contam para fechar o dia.</div>
    ${ds.result.map((m,i)=>`<div class="mealedit"><div class="me-top"><input type="time" id="me-h-${i}" value="${esc(m.hora)}" aria-label="Horário"><input type="text" id="me-n-${i}" value="${esc(m.nome)}" aria-label="Nome da refeição"><button class="mini" data-medel="${i}" aria-label="Remover">✕</button></div>
      <textarea id="me-i-${i}" rows="${Math.max(2,m.itens.length)}" aria-label="Itens">${esc(m.itens.join("\n"))}</textarea>
      <label class="tgl"><input type="checkbox" id="me-m-${i}" ${m.main?"checked":""}> Refeição principal</label></div>`).join("")}
    <button class="btn full" data-act="me-add">+ Adicionar refeição</button>
    <button class="btn green big full" data-act="ds-confirm">${isOb?"Usar esta dieta":"Salvar dieta"}</button>
    <button class="btn ghost full" data-act="ds-reset">Começar de novo</button></div>`;
}
function dsCollect(){
  if(!ds.result)return;
  ds.result=ds.result.map((m,i)=>{const g=id=>$("#"+id);if(!g("me-h-"+i))return m;
    return {...m,hora:g("me-h-"+i).value||m.hora,nome:g("me-n-"+i).value.trim()||m.nome,itens:g("me-i-"+i).value.split("\n").map(x=>x.trim()).filter(Boolean),main:g("me-m-"+i).checked}});
}
function dsMount(){const w=$("#ds-wrap");if(w)w.innerHTML=dietSetupHTML(!S.profile||obStep>0)}
const PARSE_FMT=`Responda SOMENTE em JSON: {"refeicoes":[{"nome":"Café da manhã","hora":"06:20","tipo":"cafe|lanche|almoco|pre|jantar|ceia","principal":true,"itens":["1 pão francês","2 ovos"]}],"observacao":"1 frase curta ou vazio"}. Use "principal": false para refeições opcionais. Horário no formato HH:MM.`;
async function dsRun(){
  ds.err=null; const o=ob||newOb();
  if(ds.mode==="gerar"){const r=$("#ds-restr");o.restr=r?r.value.trim():"";if(!ob)ob=o}
  let text="", file=null;
  if(ds.mode==="texto"){text=($("#ds-text")||{}).value||"";ds.text=text;if(!text.trim()){toast("Cole ou digite sua dieta");return}}
  if(ds.mode==="foto"){file=($("#ds-file")||{}).files?.[0];if(!file){toast("Escolha uma foto ou arquivo");return}
    if(/text|\.txt$/i.test(file.type+file.name)){text=await file.text();file=null}}
  const sample=await getSample();
  ds.busy=ds.mode==="gerar"?"Montando sua dieta...":"Lendo sua dieta..."; dsMount();
  try{
    let res=null;
    if(ds.mode==="gerar"){
      if(!sample)throw {code:"no_ai"};
      const dias=o.dias.map(i=>WDL[i]).join(", ")||"não treina";
      res=await sample.json(`Você é uma nutricionista prática. Monte uma dieta simples, barata e com alimentos comuns no Brasil para esta pessoa:
objetivo: ${(OBJETIVOS.find(x=>x[0]===o.objetivo)||[,"emagrecer"])[1]}; peso atual: ${o.peso||"não informado"} kg; meta: ${o.meta||"não informada"} kg; altura: ${o.altura||"não informada"} cm; idade: ${o.idade||"não informada"};
acorda às ${o.acordar}; treina às ${o.treinoHora} (${dias}); restrições ou não gosta: ${o.restr||"nada"}.
Faça de 4 a 6 refeições com horários que encaixem na rotina (um lanche antes do treino), quantidades em medidas caseiras (colheres, unidades, conchas), no máximo 5 itens por refeição.
${PARSE_FMT}`,{modelTier:"default"});
    } else if(file){
      if(!sample)throw {code:"no_ai"};
      const lim=await sample.limits().catch(()=>null);
      if(!lim||!lim.images)throw {code:"no_images"};
      res=await sample.json(`A imagem mostra uma dieta. Converta para JSON sem inventar alimentos e mantendo as quantidades. Se faltar horário, sugira um coerente. ${PARSE_FMT}`,{images:[file],modelTier:"default"});
    } else {
      if(sample){try{res=await sample.json(`Converta a dieta abaixo para JSON sem inventar alimentos e mantendo as quantidades. Ignore textos explicativos. Se faltar horário, sugira um coerente. ${PARSE_FMT}\n\nDIETA:\n"""${text.slice(0,6000)}"""`,{modelTier:"quick"})}catch(e){res=null}}
      if(!res||!Array.isArray(res.refeicoes)||!res.refeicoes.length){const loc=parseDietText(text);res={refeicoes:loc,observacao:loc.length?"Li sua dieta sem a IA. Confira se ficou certo.":""}}
    }
    const meals=normalizeMeals((res&&res.refeicoes)||[]);
    if(!meals.length)throw {code:"empty"};
    ds.result=meals; ds.nota=(res&&res.observacao)||"";
  }catch(e){
    const c=e&&e.code;
    ds.err=c==="no_ai"?"A IA só funciona abrindo o app pelo Claude. Use “Digitar ou colar” ou um modelo pronto."
      :c==="no_images"?"Não consegui ler imagens aqui. Digite ou cole a dieta."
      :c==="empty"?"Não encontrei refeições. Tente escrever assim: “07:00 Café da manhã” e os itens embaixo, um por linha."
      :AI_ERR(c);
  }
  ds.busy=null; dsMount();
}
function dsConfirm(){
  dsCollect();
  const meals=normalizeMeals(ds.result.map(m=>({...m,tipo:null})));
  if(!meals.length){toast("Adicione pelo menos uma refeição");return}
  if(!S.profile){
    const o=ob||newOb(), treinos={0:"",1:"",2:"",3:"",4:"",5:"",6:""};
    o.dias.forEach(i=>treinos[i]=(o.nomes[i]||"").trim()||"Treino");
    S.profile={avatar:{type:draft.type,color:draft.color,skin:draft.skin,hair:draft.hair,hairStyle:draft.hairStyle,nome:draft.nome||"Você",hat:null,bg:null},criado:todayKey(),
      objetivo:o.objetivo,altura:num(o.altura),idade:num(o.idade),acordar:o.acordar,treinoHora:o.treinoHora,restricoes:o.restr,
      pesoInicial:num(o.peso),pesoMeta:num(o.meta),pesos:[],treinos,aguaMeta:8,cardioMeta:15,cardioSemana:3,som:true,dieta:meals};
    if(S.profile.pesoInicial)S.profile.pesos.push({d:todayKey(),kg:S.profile.pesoInicial});
    saveProfile(); ds={}; obStep=4; render(); ding("big");
  } else {
    S.profile.dieta=meals; saveProfile(); ds={}; closeSheet(); render(); toast("Dieta salva");
  }
}

/* ---------- trocas ---------- */
function checkFood(txt){
  let used=" "+norm(txt).replace(/[^a-z0-9 -]/g," ")+" "; const hits=[];
  FOODS.forEach(([keys,v,note])=>{for(const kw of keys.split("|")){const re=new RegExp("(^|[^a-z])"+kw.replace(/[-]/g,"\\-")+"s?(?=[^a-z]|$)");if(re.test(used)){hits.push({v,note});used=used.replace(re," ");break}}});
  if(!hits.length)return null;
  const worst=hits.reduce((a,h)=>RANK[h.v]>RANK[a]?h.v:a,"ok");
  return {v:worst,notes:[...new Set(hits.filter(h=>h.v===worst||worst==="ok").map(h=>h.note))]};
}
let lastCheck=null;
function openCheck(mealId,dayK){
  const m=DIETA().find(x=>x.id===mealId)||DIETA()[0];
  openSheet(`<h2>Troquei: ${m.nome}</h2><div class="sub">Na dieta: ${esc(m.itens.join(", "))}</div>
    <label class="f" for="ck-q">O QUE VOCÊ COMEU (OU VAI COMER)?<input type="text" id="ck-q" placeholder="ex.: pão com queijo branco e café com leite"></label>
    <div class="quick">${(CHIPS[m.tipo]||CHIPS.lanche).map(c=>`<button data-chip="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <button class="btn pink big full" data-act="check" data-m="${m.id}" data-k="${dayK||""}">Verificar</button>
    <div id="ck-out"></div><div class="row-end"><button class="btn ghost" data-close="1">Fechar</button></div>`);
}
function doCheck(mealId,dayK){
  const q=($("#ck-q")||{}).value||""; if(!q.trim()){toast("Escreva o que você comeu");return}
  const r=checkFood(q); lastCheck={mealId,dayK,q:q.trim(),v:r?r.v:null};
  let h=r?`<div class="verdict ${VERD[r.v].cls}"><b>${VERD[r.v].t}</b>${r.notes.map(n=>`<p>${esc(n)}</p>`).join("")}
      ${r.v!=="ok"?`<p style="margin-top:4px"><b style="font-size:16px;color:var(--ink)">Melhor opção agora:</b></p><ul>${(ALTS[(DIETA().find(x=>x.id===mealId)||{}).tipo]||ALTS.lanche).map(a=>`<li>${esc(a)}</li>`).join("")}</ul>`:""}</div>`
    :`<div class="verdict unk"><b>Não conheço esse alimento</b><p>Peça a análise da IA abaixo, ou registre do seu jeito.</p></div>`;
  h+=`<div id="ck-ai"></div><div class="row-end">${NO_AI?"":`<button class="btn sm" data-act="ai-check">Análise com IA</button>`}${dayK?`<button class="btn green sm" data-act="save-troca">Registrar troca</button>`:""}</div>`;
  $("#ck-out").innerHTML=h; ding(r&&r.v==="no"?"low":"small");
}
async function getSample(){try{if(!window.claude||!window.claude.use)return null;return await window.claude.use("sample")}catch(e){return null}}
const AI_ERR=c=>c==="not_granted"?"Você não liberou a IA neste app. Dá para liberar no menu de permissões do app.":c==="rate_limited"?"Muitas perguntas seguidas. Espere um minuto e tente de novo.":"Não consegui falar com a IA agora. Tente de novo em instantes.";
async function aiCheck(){
  if(!lastCheck)return; const box=$("#ck-ai"), m=DIETA().find(x=>x.id===lastCheck.mealId), sample=await getSample();
  if(!sample){box.innerHTML=`<div class="ai-box">A análise com IA só funciona abrindo o app pelo Claude.</div>`;return}
  box.innerHTML=`<div class="ai-box"><span class="lbl">IA</span><span>Pensando...</span></div>`;
  const prompt=`Você é uma nutricionista prática e gentil, falando português do Brasil. A pessoa quer emagrecer e perder gordura, treina musculação de segunda a sexta e segue uma dieta simples e barata.
Refeição: ${m.nome} (${m.hora}). O que estava na dieta: ${m.itens.join("; ")}.
Ela comeu ou quer comer no lugar: "${lastCheck.q}".
Avalie se a troca serve para o objetivo. Responda SOMENTE em JSON neste formato:
{"veredito":"pode"|"moderacao"|"evitar","motivo":"no máximo 2 frases curtas","kcal_aprox":número ou null,"alternativas":["até 3 opções baratas e fáceis para esta refeição, se o veredito não for pode"]}`;
  try{
    const r=await sample.json(prompt,{modelTier:"quick"}); const v={pode:"ok",moderacao:"mod",evitar:"no"}[r.veredito]||null; if(v)lastCheck.v=v;
    box.innerHTML=`<div class="ai-box"><span class="lbl">Análise da IA</span>${v?`<b style="font-family:var(--f-game);font-weight:400;font-size:20px;color:var(--${v==="ok"?"green":v==="mod"?"orange":"red"})">${VERD[v].t}</b>`:""}
      <span>${esc(r.motivo||"")}${r.kcal_aprox?` (~${esc(r.kcal_aprox)} kcal)`:""}</span>
      ${Array.isArray(r.alternativas)&&r.alternativas.length?`<ul style="margin:0;padding-left:18px">${r.alternativas.slice(0,3).map(a=>`<li>${esc(a)}</li>`).join("")}</ul>`:""}</div>`;
  }catch(e){box.innerHTML=`<div class="ai-box">${esc(AI_ERR(e&&e.code))}</div>`}
}
async function aiSweet(){
  const q=($("#sw-q")||{}).value||"", out=$("#sw-out"); out.hidden=false; const sample=await getSample();
  if(!sample){out.innerHTML="A IA só funciona abrindo o app pelo Claude. Use a lista verde acima.";return}
  out.innerHTML=`<span class="lbl">IA</span><span>Pensando...</span>`;
  const prompt=`Português do Brasil. Uma pessoa que quer emagrecer está com muita vontade de doce. ${q.trim()?`Ela tem disponível: "${q.trim()}".`:"Ela não disse o que tem em casa; sugira coisas baratas de mercado."}
Sugira 3 opções de doce leve, fáceis e baratas, cada uma com até 150 kcal. Responda SOMENTE em JSON: {"ideias":[{"nome":"...","como":"1 frase","kcal":número}]}`;
  try{const r=await sample.json(prompt,{modelTier:"quick"}); const ideas=(r&&Array.isArray(r.ideias))?r.ideias.slice(0,3):[];
    out.innerHTML=`<span class="lbl">Ideias da IA</span>`+ideas.map(i=>`<div class="sweet"><div><b>${esc(i.nome)}</b><small>${esc(i.como)}</small></div><span class="kcal low">${esc(i.kcal)}</span></div>`).join("");
  }catch(e){out.innerHTML=esc(AI_ERR(e&&e.code))}
}

/* ---------- ações ---------- */
function day(k){S.days[k]=S.days[k]||{};return S.days[k]}
let tapXY={x:innerWidth/2,y:innerHeight/2};
function reward(before,k){
  const diff=dayInfo(k).xp-before;
  if(diff>0){floatXP(diff,tapXY.x,tapXY.y);ding("small");buzz(25);jumpNext=true}
}
document.addEventListener("pointerdown",e=>{tapXY={x:e.clientX,y:e.clientY}},true);
document.addEventListener("click",e=>{
  const b=e.target.closest("button,[data-close]"); if(!b)return;
  if(b.classList.contains("sheet-bg")&&e.target!==b)return;
  if(b.dataset.close){closeSheet();render();return}
  const D=b.dataset;
  if(D.tab){view.tab=D.tab;if(D.tab==="hoje")view.day=todayKey();render();window.scrollTo(0,0);return}
  if(D.type){if(draft.type!==D.type)draft.color=TYPE_COLOR[D.type];draft.type=D.type;refreshAvatarForm();return}
  if(D.color){draft.color=D.color;refreshAvatarForm();return}
  if(D.skin){draft.skin=+D.skin;refreshAvatarForm();return}
  if(D.hair){draft.hair=D.hair;refreshAvatarForm();return}
  if(D.hs){draft.hairStyle=D.hs;refreshAvatarForm();return}
  if(D.obj){obCollect();ob.objetivo=D.obj;render();return}
  if(D.dia){obCollect();const n=+D.dia;ob.dias=ob.dias.includes(n)?ob.dias.filter(x=>x!==n):ob.dias.concat(n);render();return}
  if(D.nt){const c=NT();c[D.nt]=!c[D.nt];S.profile.notif=c;saveProfile();refreshNotifSheet();return}
  if(D.dsmode){ds.mode=D.dsmode;ds.err=null;dsMount();return}
  if(D.medel!==undefined){dsCollect();ds.result.splice(+D.medel,1);dsMount();return}
  if(D.chip){const i=$("#ck-q");if(i){i.value=D.chip;i.focus()}return}
  if(D.pick){pickPromise=D.pick;render();return}
  if(D.wear!==undefined){S.profile.avatar[D.kind]=D.wear||null;saveProfile();render();ding("small");return}
  if(D.timer){startCardio(+D.timer);return}
  const k=view.day, before=dayInfo(k).xp;
  if(D.meal){
    if(D.s==="troca"){openCheck(D.meal,k);return}
    const d=day(k);d.meals=d.meals||{};d.meals[D.meal]={s:D.s};saveDay(k);if(D.closeAfter)closeSheet();if(D.s==="ok")reward(before,k);render();return}
  if(D.unmeal){const d=day(k);if(d.meals)delete d.meals[D.unmeal];saveDay(k);render();return}
  switch(D.act){
    case "prev":view.day=addDays(k,-1);render();break;
    case "next":view.day=addDays(k,1);render();break;
    case "treino":{const d=day(k);d.treino=!d.treino;saveDay(k);if(d.treino)reward(before,k);render();break}
    case "agua+":{const d=day(k);d.agua=Math.min(20,(d.agua||0)+1);saveDay(k);reward(before,k);if(dayInfo(k).xp===before)ding("small");render();break}
    case "agua-":{const d=day(k);d.agua=Math.max(0,(d.agua||0)-1);saveDay(k);render();break}
    case "cardio-undo":{const d=day(k);delete d.cardio;saveDay(k);render();break}
    case "cardio-manual":openSheet(`<h2>Quanto tempo de cardio?</h2><div class="quick">${[10,15,20,30,40,60].map(m=>`<button data-cmin="${m}">${m} min</button>`).join("")}</div><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button></div>`);break;
    case "tm-pause":if(tmr){if(tmr.paused){tmr.paused=false;tmr.start=Date.now();b.textContent="Pausar"}else{tmr.acc+=Date.now()-tmr.start;tmr.paused=true;b.textContent="Continuar"}try{localStorage.setItem("focofit.timer",JSON.stringify(tmr))}catch(e){}}break;
    case "tm-stop":if(tmr){const m=Math.floor(cardioElapsed()/60000);finishCardio(m)}break;
    case "bau":openChest(k);break;
    case "open-check":openCheck($("#tq-meal").value,null);break;
    case "check":doCheck(D.m,D.k||null);break;
    case "ai-check":aiCheck();break;
    case "save-troca":{if(!lastCheck||!lastCheck.dayK)break;const kk=lastCheck.dayK,bf=dayInfo(kk).xp,v=lastCheck.v||"mod",d=day(kk);d.meals=d.meals||{};
      d.meals[lastCheck.mealId]={s:"troca",o:lastCheck.q.slice(0,80),v};saveDay(kk);closeSheet();reward(bf,kk);render();break}
    case "sos":startSOS();break;
    case "sos-win":{const t=todayKey(),bf=dayInfo(t).xp,d=day(t);d.doce=1;saveDay(t);stopTimers();
      openFull(`<div class="glow">${avatarSVG(S.profile.avatar,stageOf(levelOf(computeAll().xp).L),false)}</div><h2 style="color:var(--green)">Você venceu o doce!</h2><p>${dayInfo(t).xp>bf?"+15 XP. ":""}Isso é disciplina de verdade.</p><button class="btn green big" data-close="1">Fechar</button>`);
      $(".fs .glow svg").style.cssText="width:150px;height:175px";confetti(140);ding("big");break}
    case "sos-eat":stopTimers();closeSheet();view.tab="doces";render();setTimeout(()=>{const el=$(".sec:nth-of-type(2)");if(el)el.scrollIntoView({behavior:"smooth"})},50);toast("Escolha um da lista verde, numa porção só");break;
    case "ai-sweet":aiSweet();break;
    case "add-w":{const v=num($("#w-kg").value);if(!v||v<30||v>300){toast("Digite o peso em kg, ex.: 72,5");break}
      const p=S.profile;p.pesos=(p.pesos||[]).filter(w=>w.d!==todayKey());p.pesos.push({d:todayKey(),kg:v});if(!num(p.pesoInicial))p.pesoInicial=v;saveProfile();render();toast("Peso salvo");break}
    case "ob-next":obCollect();if(obStep===1&&!draft.nome.trim()){draft.nome="Você"}
      if(obStep===1&&pendingPlan){profileFromPlan(pendingPlan);pendingPlan=null;incoming=null;obStep=4;try{history.replaceState(null,"",location.pathname)}catch(e){}render();window.scrollTo(0,0);ding("big");break}
      obStep++;render();window.scrollTo(0,0);break;
    case "ob-back":obCollect();obStep=Math.max(1,obStep-1);ds.busy=null;render();window.scrollTo(0,0);break;
    case "ob-finish":if(window.FFNative&&notifPerm!=="granted")askNotif();obStep=0;view.tab="hoje";render();window.scrollTo(0,0);confetti(150);ding("big");break;
    case "ds-run":dsRun();break;
    case "ds-template":{const o=ob||newOb();ds.result=templateMeals(o.objetivo,o.acordar||P().acordar);ds.nota="Modelo: "+TEMPLATES[o.objetivo].nome+". Ajuste como quiser.";dsMount();break}
    case "ds-reset":ds={};dsMount();break;
    case "me-add":{dsCollect();const last=ds.result[ds.result.length-1];ds.result.push({id:"x"+Date.now(),tipo:"lanche",hora:last?fmtHora(Math.min(23,horaNum(last.hora)+2)):"10:00",nome:"Lanche",itens:[],main:false});dsMount();break}
    case "ds-confirm":dsConfirm();break;
    case "edit-diet":{ob=ob||{...newOb(),objetivo:P().objetivo||"emagrecer",acordar:P().acordar||"06:00",treinoHora:P().treinoHora||"18:00",restr:P().restricoes||""};
      ds={result:DIETA().map(m=>({...m}))};openSheet(`<h2>Minha dieta e horários</h2><div id="ds-wrap">${dietSetupHTML(false)}</div><button class="btn ghost full" data-act="ds-reset">Refazer dieta (colar, foto ou IA)</button><button class="btn ghost full" data-close="1">Fechar</button>`);break}
    case "reminders":openSheet(`<h2>${window.FFNative?"Notificações":"Lembretes no celular"}</h2>${remindersHTML()}<button class="btn ghost full" data-close="1">Fechar</button>`);break;
    case "ics":downloadICS();break;
    case "update":showUpdateSheet();break;
    case "check-update":checkUpdate(true);break;
    case "backup":openSheet(`<h2>Backup dos dados</h2><div class="sub">Seus dados ficam guardados neste aparelho. Copie o backup e guarde (por exemplo, mande para você no WhatsApp). Para restaurar, cole aqui.</div>
      <button class="btn pink full" data-act="bk-copy">Copiar meu backup</button>
      <label class="f" for="bk-in">RESTAURAR: COLE O BACKUP AQUI<textarea id="bk-in" rows="4"></textarea></label>
      <button class="btn full" data-act="bk-restore">Restaurar backup</button><button class="btn ghost full" data-close="1">Fechar</button>`);break;
    case "bk-copy":{const txt=JSON.stringify(PRO?{...S,pro:PRO}:S);navigator.clipboard.writeText(txt).then(()=>toast("Backup copiado"),()=>{const t=$("#bk-in");t.value=txt;t.select();toast("Selecione e copie o texto")});break}
    case "bk-restore":{try{const o=JSON.parse($("#bk-in").value);if(!o||!o.profile||typeof o.days!=="object")throw 0;S={profile:o.profile,days:o.days};if(o.pro){PRO=o.pro;proSave()}saveProfile();Object.keys(S.days).forEach(x=>saveDay(x));closeSheet();lastLevel=null;render();toast("Backup restaurado")}catch(e){toast("Esse texto não é um backup do Foco Fit")}break}
    case "notif-ask":askNotif().then(refreshNotifSheet);break;
    case "notif-exact":try{LN.changeExactNotificationSetting().then(r=>{exactOk=r&&r.exact_alarm;refreshNotifSheet()})}catch(e){}break;
    case "notif-test":if(LN){(async()=>{if(notifPerm!=="granted"&&!(await askNotif())){toast("Libere as notificações nos ajustes do celular");return}
      const m=DIETA()[0];await LN.schedule({notifications:[{id:999,channelId:"refeicoes",actionTypeId:"MEAL",title:"Teste do Foco Fit",body:"Assim chega o aviso. Toque para abrir o registro.",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true},extra:{kind:"meal",meal:m&&m.id}}]});toast("Aviso chegando em 5 segundos");refreshNotifSheet()})()}break;
    case "edit-avatar":{draft={...S.profile.avatar};openSheet(`<h2>Trocar personagem</h2>${avatarForm()}<div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn pink" data-act="save-avatar">Salvar</button></div>`);break}
    case "save-avatar":{const nm=$("#av-nome");draft.nome=(nm&&nm.value.trim())||S.profile.avatar.nome;S.profile.avatar={...S.profile.avatar,...draft};saveProfile();closeSheet();render();break}
    case "som":S.profile.som=S.profile.som===false;saveProfile();render();break;
    case "edit-plan":{const p=S.profile,t=p.treinos||DEFAULT_TREINOS;
      openSheet(`<h2>Treinos e metas</h2><div class="sub">Deixe em branco os dias de descanso.</div>
        ${[1,2,3,4,5,6,0].map(i=>`<label class="f" for="tr-${i}">${WDL[i].toUpperCase()}<input type="text" id="tr-${i}" value="${esc(t[i]||"")}"></label>`).join("")}
        <div class="grid2"><label class="f" for="pl-acordar">ACORDO ÀS<input type="time" id="pl-acordar" value="${esc(p.acordar||"06:00")}"></label><label class="f" for="pl-treinoh">TREINO ÀS<input type="time" id="pl-treinoh" value="${esc(p.treinoHora||"18:00")}"></label></div>
        <label class="f" for="pl-agua">META DE ÁGUA (COPOS)<input type="number" id="pl-agua" min="4" max="14" value="${p.aguaMeta||8}"></label>
        <label class="f" for="pl-cardio">CARDIO POR DIA (MIN)<input type="number" id="pl-cardio" min="5" max="90" value="${p.cardioMeta||15}"></label>
        <label class="f" for="pl-cs">CARDIOS POR SEMANA<input type="number" id="pl-cs" min="1" max="7" value="${p.cardioSemana||3}"></label>
        <label class="f" for="pl-meta">META DE PESO (KG)<input type="number" id="pl-meta" step="0.1" value="${p.pesoMeta??""}"></label>
        <div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn pink" data-act="save-plan">Salvar</button></div>`);break}
    case "save-plan":{const p=S.profile;p.treinos={};[0,1,2,3,4,5,6].forEach(i=>p.treinos[i]=$("#tr-"+i).value.trim());
      const cl=(v,a,b,dd)=>{const n=num(v);return n==null?dd:Math.max(a,Math.min(b,Math.round(n)))};
      p.aguaMeta=cl($("#pl-agua").value,4,14,8);p.cardioMeta=cl($("#pl-cardio").value,5,90,15);p.cardioSemana=cl($("#pl-cs").value,1,7,3);p.pesoMeta=num($("#pl-meta").value);p.acordar=$("#pl-acordar").value||p.acordar;p.treinoHora=$("#pl-treinoh").value||p.treinoHora;
      saveProfile();closeSheet();render();toast("Salvo");break}
    case "reset":openSheet(`<h2>Apagar tudo?</h2><p style="margin:0">Isso apaga seu personagem, XP, refeições e pesos. Não dá para desfazer.</p>
        <div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn" style="background:var(--red);border-color:var(--red)" data-act="reset-yes">Apagar</button></div>`);break;
    case "reset-yes":{const ids=["profile",...Object.keys(S.days).map(x=>"d"+x)];if(col)ids.forEach(id=>col.doc(id).delete().catch(()=>{}));
      S={profile:null,days:{}};lsSave();closeSheet();lastLevel=null;lastComplete=null;draft=null;ob=null;ds={};obStep=0;render();break}
  }
  if(D.cmin){const d=day(k);d.cardio=+D.cmin;saveDay(k);closeSheet();reward(before,k);render()}
});
async function downloadICS(){
  const txt=buildICS({treino:true,agua:true});
  if(!window.claude||!window.claude.use){
    const url=URL.createObjectURL(new Blob([txt],{type:"text/calendar"})),a=document.createElement("a");
    a.href=url;a.download="lembretes-foco-fit.ics";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast("Abra o arquivo para adicionar ao calendário");return;
  }
  try{const dl=window.claude&&window.claude.use?await window.claude.use("downloads"):null;
    if(!dl){toast("Não deu para baixar aqui. Use os botões do Google Agenda.");return}
    await dl.save({filename:"lembretes-foco-fit.ics",data:txt});toast("Arquivo salvo. Abra para adicionar ao calendário.");
  }catch(e){if(e&&e.code!=="cancelled"&&e.code!=="declined")toast("Não deu para baixar. Use os botões do Google Agenda.")}
}
function openChest(k){
  const own=owned(), pool=ITEMS.filter(x=>!own.has(x.id));
  const it=pool.length?pool[Math.floor(Math.random()*pool.length)]:null;
  const d=day(k); d.bau=it?it.id:"xp"; saveDay(k);
  if(it){S.profile.avatar[it.tipo]=it.id;saveProfile()}
  const art=it?(it.tipo==="hat"?`<svg viewBox="0 0 120 80">${hatSVG(it.id,60,44)}</svg>`:`<svg viewBox="0 0 100 100"><foreignObject x="0" y="0" width="100" height="100"><div xmlns="http://www.w3.org/1999/xhtml" class="bg-${it.id}" style="width:100px;height:100px;border-radius:24px"></div></foreignObject></svg>`)
    :`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#FFD84A"/><text x="50" y="60" text-anchor="middle" font-size="26" font-weight="900" fill="#5a3d00" font-family="sans-serif">+40</text></svg>`;
  openFull(`<div class="reveal glow">${art}</div><h2 style="color:var(--yellow)">${it?"Novo item!":"Bônus de XP!"}</h2>
    <p>${it?`Você ganhou <b style="color:var(--ink)">${esc(it.nome)}</b>. Já coloquei no seu personagem. Troque quando quiser em Evolução.`:"Você já tem todos os itens. Ganhou +40 XP."}</p>
    <button class="btn yellow big" data-close="1">Uhuul!</button>`);
  confetti(180);ding("big");buzz([30,30,60]);jumpNext=true;
}
/* segurar para prometer */
let holdT=null;
document.addEventListener("pointerdown",e=>{const h=e.target.closest("#hold");if(!h||!pickPromise)return;e.preventDefault();h.classList.add("go");
  holdT=setTimeout(()=>{const k=todayKey(),d=day(k);d.promessa=pickPromise;pickPromise=null;saveDay(k);ding("big");buzz([20,30,20]);confetti(90);toast("Promessa feita! Agora é com você.");render()},1100)});
["pointerup","pointerleave","pointercancel"].forEach(ev=>document.addEventListener(ev,e=>{if(holdT){clearTimeout(holdT);holdT=null}const h=$("#hold");if(h)h.classList.remove("go")}));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!tmr)closeSheet();
  if(e.key==="Enter"&&e.target.id==="ck-q"){const b=$('[data-act="check"]');if(b)b.click()}
  if((e.key==="Enter"||e.key===" ")&&e.target.id==="hold"&&pickPromise){e.preventDefault();const k=todayKey(),d=day(k);d.promessa=pickPromise;pickPromise=null;saveDay(k);ding("big");render()}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden)flush();else if(!tmr){if(view.day<addDays(todayKey(),-6))view.day=todayKey();render()}else if(tmr.kind==="cardio")keepAwake()});

/* ---------- app Android: notificações locais ---------- */
const FFN = window.FFNative||null;
const LN = FFN&&FFN.LocalNotifications;
const NT = ()=>({on:true,agua:true,treino:true,noite:true,...(P().notif||{})});
let notifPerm=null, exactOk=null, syncT=null;
async function notifSetup(){
  if(!LN)return;
  try{
    await LN.createChannel({id:"refeicoes",name:"Refeições e treino",description:"Lembretes nos horários da sua dieta",importance:5,visibility:1,vibration:true});
    await LN.createChannel({id:"agua",name:"Água",description:"Lembretes para beber água",importance:3,visibility:1,vibration:true});
    await LN.registerActionTypes({types:[
      {id:"MEAL",actions:[{id:"ok",title:"Segui ✓"},{id:"troca",title:"Troquei"}]},
      {id:"AGUA",actions:[{id:"ok",title:"+1 copo"}]},
      {id:"TREINO",actions:[{id:"ok",title:"Treinei ✓"}]}]});
    await LN.addListener("localNotificationActionPerformed",ev=>onNotifTap(ev.actionId,(ev.notification&&ev.notification.extra)||{}));
    notifPerm=(await LN.checkPermissions()).display;
    try{exactOk=(await LN.checkExactNotificationSetting()).exact_alarm}catch(e){}
  }catch(e){console.warn("notif setup",e)}
}
async function askNotif(){
  if(!LN)return false;
  try{notifPerm=(await LN.requestPermissions()).display}catch(e){}
  if(notifPerm==="granted")queueNotifSync(10);
  return notifPerm==="granted";
}
function queueNotifSync(ms){if(!LN)return;clearTimeout(syncT);syncT=setTimeout(syncNotifs,ms??1500)}
function mealTitle(m){const n=m.nome, l=n.toLowerCase();return /^(lanche|almoço|almoco|jantar|café|cafe)/.test(l)?"Hora do "+l:"Hora: "+n}
async function syncNotifs(){
  if(!LN||!S.profile)return;
  try{
    const pend=await LN.getPending();
    const old=(pend.notifications||[]).filter(n=>n.id!==950&&n.id!==999);
    if(old.length)await LN.cancel({notifications:old.map(n=>({id:n.id}))});
    const cfg=NT(); if(!cfg.on||notifPerm!=="granted")return;
    const list=[], hm=h=>{const n=horaNum(h);return {hour:Math.floor(n),minute:Math.round((n%1)*60)%60}};
    DIETA().forEach((m,i)=>list.push({id:100+i,channelId:"refeicoes",actionTypeId:"MEAL",title:mealTitle(m),
      body:`${m.itens.slice(0,3).join(" · ")}. Toque para registrar${m.main?" e ganhar +10 XP":""}.`,
      schedule:{on:hm(m.hora),allowWhileIdle:true},extra:{kind:"meal",meal:m.id}}));
    if(cfg.treino){const th=hm(P().treinoHora||"18:00");[0,1,2,3,4,5,6].forEach(wd=>{const t=treinoDo2(wd);if(t)list.push({id:200+wd,channelId:"refeicoes",actionTypeId:"TREINO",
      title:`Treino de ${t} hoje`,body:"Só ir já é 80% da vitória. Separe a roupa e vá!",schedule:{on:{weekday:wd+1,...th},allowWhileIdle:true},extra:{kind:"treino"}})})}
    if(cfg.agua){const a=horaNum(P().acordar||"06:00");let n=0;for(let h=a+2;h<=21;h+=2.5)list.push({id:300+(n++),channelId:"agua",actionTypeId:"AGUA",
      title:"Bora beber água",body:"Um copo agora te deixa mais perto da meta.",schedule:{on:hm(fmtHora(h)),allowWhileIdle:true},extra:{kind:"agua"}})}
    if(cfg.noite){const t=todayKey(),i=dayInfo(t),at=new Date();at.setHours(21,0,0,0);
      if(!i.complete&&at>new Date())list.push({id:900,channelId:"refeicoes",title:`${(P().avatar&&P().avatar.nome&&P().avatar.nome!=="Você")?P().avatar.nome:"Seu personagem"} está esperando você`,
        body:`Faltam ${Math.max(0,i.need-i.good)} refeições${i.treinoDia&&!i.d.treino?" e o treino":""} para fechar o dia e manter a sequência.`,schedule:{at,allowWhileIdle:true},extra:{kind:"noite"}})}
    if(list.length)await LN.schedule({notifications:list});
  }catch(e){console.warn("notif sync",e)}
}
function onNotifTap(actionId,extra){
  const t=todayKey(); view.tab="hoje"; view.day=t; closeSheet();
  if(!S.profile){render();return}
  const before=dayInfo(t).xp;
  if(extra.kind==="meal"){
    const m=DIETA().find(x=>x.id===extra.meal);
    if(m&&actionId==="ok"){const d=day(t);d.meals=d.meals||{};d.meals[m.id]={s:"ok"};saveDay(t);reward(before,t);render();toast(`${m.nome} registrado!`);return}
    if(m&&actionId==="troca"){render();openCheck(m.id,t);return}
    render();
    if(m&&!(day(t).meals||{})[m.id])openSheet(`<h2>${esc(m.nome)}</h2><div class="sub">${esc(m.itens.join(" · "))}</div>
      <button class="btn green big full" data-meal="${m.id}" data-s="ok" data-close-after="1">Segui ✓</button>
      <button class="btn full" data-meal="${m.id}" data-s="troca">Troquei por outra coisa</button>
      <button class="btn ghost full" data-meal="${m.id}" data-s="pulei" data-close-after="1">Pulei</button>`);
    return;
  }
  if(extra.kind==="update"){render();showUpdateSheet();return}
  if(extra.kind==="agua"&&actionId==="ok"){const d=day(t);d.agua=Math.min(20,(d.agua||0)+1);saveDay(t);reward(before,t);render();toast("+1 copo d’água");return}
  if(extra.kind==="treino"&&actionId==="ok"){const d=day(t);d.treino=true;saveDay(t);reward(before,t);render();return}
  if(extra.kind==="treino")view.tab="treino";
  render();
}
function notifSettingsHTML(){
  const c=NT();
  const row=(k,t,s)=>`<button class="tgrow" data-nt="${k}" aria-pressed="${!!c[k]}"><span><b>${t}</b><small>${s}</small></span><i class="sw ${c[k]?"on":""}"></i></button>`;
  return `<div class="stack">
    ${notifPerm!=="granted"?`<div class="verdict mod"><p>As notificações ainda não estão liberadas no celular.</p><button class="btn yellow" data-act="notif-ask">Permitir notificações</button></div>`:""}
    ${row("on","Notificações","Liga ou desliga todos os avisos")}
    <div class="tip">Você recebe um aviso no horário de cada refeição:</div>
    ${DIETA().map(m=>`<div class="remind"><b>${m.hora}</b><span>${esc(m.nome)}</span><i>${c.on?"ativo":"desligado"}</i></div>`).join("")}
    ${row("treino","Treino",`Nos dias de treino, às ${esc(P().treinoHora||"18:00")}`)}
    ${row("agua","Água","A cada 2 horas e meia durante o dia")}
    ${row("noite","Aviso das 21h","Só se o dia ainda não estiver cumprido")}
    ${exactOk==="denied"?`<div class="verdict unk"><p>Para os avisos chegarem no minuto exato, libere “Alarmes e lembretes” para o Foco Fit.</p><button class="btn" data-act="notif-exact">Abrir ajuste</button></div>`:""}
    <button class="btn cyan full" data-act="notif-test">Testar agora (aviso em 5 segundos)</button>
    <div class="tip">Para mudar os horários, vá em Minha dieta e horários. Os avisos se ajustam sozinhos.</div></div>`;
}
/* aviso de versão nova (só no app Android) */
const APK_URL="https://github.com/NandaTobias56/FOCO_FIT/releases/latest/download/foco-fit.apk";
let newBuild=null; try{newBuild=+localStorage.getItem("focofit.newbuild")||null}catch(e){}
const myBuild=()=>+(window.FF_BUILD||0);
function updateBanner(){
  if(!window.FFNative||!newBuild||newBuild<=myBuild())return "";
  return `<button class="upd" data-act="update"><b>Versão nova disponível</b><span>Toque para baixar a 1.${newBuild}. Seus dados continuam.</span></button>`;
}
function showUpdateSheet(){
  openSheet(`<h2>Atualizar o Foco Fit</h2><div class="sub">Versão 1.${newBuild||"nova"} disponível. Você está na 1.${myBuild()}.</div>
    <ol class="tips"><li>Toque em <b>Baixar atualização</b>.</li><li>Abra o arquivo baixado e toque em <b>Atualizar</b>.</li><li>Pronto! Seus dados, XP e personagem continuam.</li></ol>
    <a class="btn yellow big full" href="${APK_URL}" target="_blank" rel="noopener">Baixar atualização</a>
    <button class="btn ghost full" data-close="1">Depois</button>`);
}
async function checkUpdate(force){
  if(!window.FFNative||!myBuild())return;
  try{
    const last=+localStorage.getItem("focofit.updcheck")||0;
    if(!force&&Date.now()-last<3*3600e3)return;
    localStorage.setItem("focofit.updcheck",String(Date.now()));
    const r=await fetch("https://api.github.com/repos/NandaTobias56/FOCO_FIT/releases/latest",{headers:{Accept:"application/vnd.github+json"}});
    if(!r.ok)return;
    const n=+String((await r.json()).tag_name||"").replace(/\D/g,"");
    if(!n||n<=myBuild()){if(force)toast("Você já está na versão mais nova");return}
    const was=newBuild; newBuild=n; localStorage.setItem("focofit.newbuild",String(n));
    if(view.tab==="hoje"&&!$(".sheet"))render();
    if(LN&&notifPerm==="granted"&&+localStorage.getItem("focofit.updnotified")!==n){
      localStorage.setItem("focofit.updnotified",String(n));
      await LN.schedule({notifications:[{id:950,channelId:"refeicoes",title:"Tem versão nova do Foco Fit",body:"Toque para atualizar. Seus dados continuam salvos.",schedule:{at:new Date(Date.now()+1500)},extra:{kind:"update"}}]});
    }
    if(force)showUpdateSheet();
  }catch(e){}
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkUpdate()});
const refreshNotifSheet=()=>{const sh=$(".sheet");if(sh)sh.innerHTML=`<h2>Notificações</h2>${notifSettingsHTML()}<button class="btn ghost full" data-close="1">Fechar</button>`;else render()};

