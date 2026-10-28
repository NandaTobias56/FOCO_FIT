/* ---------- treino com exercícios, vídeos e cargas ---------- */
IC.treino=IC.gym;
const codeOf = c=>{c=String(c||"");const m=c.match(/[#/](?:p|r)[=/]([\w-]+)/);return m?m[1]:c.replace(/[^\w-]/g,"")};
const ytId = s=>{s=String(s||"").trim();if(/^[\w-]{11}$/.test(s))return s;const m=s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);return m?m[1]:""};
const exInfo = e=>{if(EXM[e])return EXM[e];const nome=String(e||"").replace(/^x:/,"").trim()||"Exercício";return {id:e,nome,grupo:"outro",equip:"",v:"",dicas:[],erro:""}};
const ytSearch = nome=>"https://www.youtube.com/results?search_query="+encodeURIComponent("como fazer "+nome+" execução correta");
const ytWatch = id=>"https://www.youtube.com/watch?v="+id;
const vidOf = it=>ytId(it.v)||(typeof PRO!=="undefined"&&PRO&&PRO.videos&&ytId(PRO.videos[it.e]))||exInfo(it.e).v||"";
const grupoTag = g=>{const x=GRUPOS[g]||GRUPOS.outro;return `<span class="gchip" style="--g:${x[1]}">${x[0]}</span>`};
function openExt(url){if(FFN){location.href=url;return}const w=window.open(url,"_blank","noopener");if(!w)location.href=url}
const waNum = s=>{let d=String(s||"").replace(/\D/g,"");if(d.length===10||d.length===11)d="55"+d;return d};
const waLink = (num,txt)=>"https://wa.me/"+(waNum(num)||"")+"?text="+encodeURIComponent(txt);

/* parâmetros e geração automática */
function exParams(obj,nivel,g){
  const b=obj==="massa"?{s:4,r:"8-12",d:90}:obj==="emagrecer"?{s:3,r:"12-15",d:45}:{s:3,r:"10-12",d:60};
  if(nivel==="iniciante")b.s=3; else if(nivel==="avancado")b.s=4;
  if(g==="abdomen")return {s:3,r:"15-20",d:40};
  return b;
}
function groupsOf(nome){const n=norm(nome),g=[];DAY_GROUPS.forEach(([re,gs])=>{if(re.test(n))gs.forEach(x=>{if(!g.includes(x))g.push(x)})});return g}
function genDay(nome,opt){
  opt=opt||{}; const gs=groupsOf(nome); if(!gs.length)return [];
  const n={iniciante:5,intermediario:6,avancado:7}[opt.nivel||"intermediario"]||6;
  const variant=/\bb$/i.test(String(nome).trim())?1:0, counts=gs.map(()=>0);
  for(let k=0;k<Math.max(n,Math.min(gs.length,7));k++)counts[k%gs.length]++;
  const out=[],used=new Set();
  gs.forEach((g,gi)=>{const list=PICKS[g]||[];let got=0;
    for(let j=0;j<list.length&&got<counts[gi];j++){const id=list[(j+variant)%list.length];if(used.has(id))continue;used.add(id);got++;
      const p=exParams(opt.obj,opt.nivel,g);out.push({e:id,s:p.s,r:id==="prancha"?"30-40s":p.r,d:p.d,c:"",o:"",v:""})}});
  return out;
}
function genWeek(dias,foco,obj,nivel){
  const ds=dias.slice().sort((a,b)=>((a+6)%7)-((b+6)%7)), names=(SPLITS[foco]||SPLITS.equilibrado)[Math.min(6,Math.max(1,ds.length))]||[];
  const t={}; ds.forEach((wd,i)=>{const nome=names[i]||"Corpo todo";t[wd]={nome,ex:genDay(nome,{obj,nivel})}}); return t;
}
function planDay(wd){
  const p=P(), nm=(p.treinos||DEFAULT_TREINOS)[wd]||"", t=p.plano&&p.plano.treinos&&p.plano.treinos[wd];
  if(t&&t.ex&&(!t.auto||t.nome===nm)&&nm)return t;
  if(!nm)return null;
  return {nome:nm,ex:genDay(nm,{obj:p.objetivo,nivel:p.nivel}),auto:true};
}
const estMin = ex=>Math.round(ex.reduce((a,it)=>a+(+it.s||3)*(40+(+it.d||60)),0)/60)+5;

/* histórico de cargas */
function logsOf(e,beforeK){const out=[];Object.keys(S.days).sort().reverse().forEach(k=>{if(beforeK&&k>=beforeK)return;const l=S.days[k].tlog;if(!l)return;
  (l.ex||[]).forEach(x=>{if(x.e===e&&x.sets&&x.sets.length)out.push({k,sets:x.sets})})});return out}
const maxKg = sets=>sets.reduce((m,s)=>Math.max(m,+s[0]||0),0);
function bestKg(e,beforeK){return logsOf(e,beforeK).reduce((m,l)=>Math.max(m,maxKg(l.sets)),0)}
const topReps = r=>{const m=String(r||"").match(/(\d+)\D*(\d+)?/);return m?+(m[2]||m[1]):0};
const lowReps = r=>{const m=String(r||"").match(/(\d+)/);return m?+m[1]:""};

/* blocos visuais */
function thumbHTML(it,small){
  const id=vidOf(it), x=exInfo(it.e), col=(GRUPOS[x.grupo]||GRUPOS.outro)[1];
  return `<span class="th ${small?"sm":""}" style="--g:${col}${id?`;background-image:url(https://i.ytimg.com/vi/${id}/mqdefault.jpg)`:""}">${id?"<i>▶</i>":IC.gym}</span>`;
}
function videoBlock(it){
  const id=vidOf(it), x=exInfo(it.e);
  if(!id)return `<div class="vid novid">${IC.gym}<a class="btn white sm" href="${ytSearch(x.nome)}" target="_blank" rel="noopener">Ver vídeos no YouTube</a></div>`;
  return `<div class="vid" id="vid"><button class="thumb" data-x="play" data-v="${id}" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)" aria-label="Assistir vídeo de ${esc(x.nome)}"><i>▶</i><span>Ver como faz</span></button></div>
    <div class="vlinks"><a href="${ytWatch(id)}" target="_blank" rel="noopener">Abrir no YouTube</a><a href="${ytSearch(x.nome)}" target="_blank" rel="noopener">Outros vídeos</a></div>`;
}
function playVideo(btn){const id=btn.dataset.v,box=btn.closest(".vid");if(!box)return;
  box.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="Vídeo do exercício" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`}
const fmtEx = it=>`${it.s||3} × ${esc(it.r||"12")}${it.d?` · ${it.d}s descanso`:""}${it.c?` · ${esc(it.c)}`:""}`;
function exRowHTML(it,i,act){
  const x=exInfo(it.e), b=bestKg(it.e);
  return `<button class="exrow" data-x="${act||"ex-view"}" data-i="${i}">${thumbHTML(it,true)}<span class="t"><b>${esc(x.nome)}</b><small>${fmtEx(it)}${b?` · recorde ${kg(b).replace(",0","")} kg`:""}</small></span><span class="n">${i+1}</span></button>`;
}

/* aba Treino do aluno */
function renderTreino(){
  const p=S.profile, pl=p.plano||{}, prof=pl.prof, t=todayKey(), twd=new Date().getDay();
  let h=`<div class="sec"><h2>Meu treino</h2><small>${prof?"plano do professor":"montado pelo app"}</small></div>`;
  if(W)h+=`<button class="upd" data-x="w-resume"><b>Treino em andamento: ${esc(W.nome)}</b><span>Toque para continuar de onde parou</span></button>`;
  if(prof)h+=`<div class="card prof"><div class="pi">${esc((prof.nome||"P")[0].toUpperCase())}</div><div class="t"><b>Prof. ${esc(prof.nome)}</b><span>${prof.cref?"CREF "+esc(prof.cref)+" · ":""}plano recebido em ${dateOf(keyOf(new Date(pl.recebido||Date.now()))).getDate()} ${MES[new Date(pl.recebido||Date.now()).getMonth()]}</span></div></div>
    ${pl.msg?`<div class="pnote">“${esc(pl.msg)}”</div>`:""}
    <div class="grid2" style="margin-top:8px"><button class="btn pink" data-x="rel-open">Enviar relatório</button>${prof.whats?`<a class="btn" href="${waLink(prof.whats,"Oi prof! ")}" target="_blank" rel="noopener">WhatsApp</a>`:`<button class="btn" data-x="code-open">Novo código</button>`}</div>`;
  else h+=`<div class="card stack"><div class="tip"><b style="color:var(--ink)">Tem personal?</b> Peça para seu professor montar seu plano no Foco Fit. Ele te manda um link: é só abrir aqui no celular.</div><button class="btn full" data-x="code-open">Tenho um código do professor</button></div>`;
  /* semana */
  h+=`<div class="sec"><h2>Semana</h2><small>toque no dia</small></div><div class="card days">`;
  [1,2,3,4,5,6,0].forEach(wd=>{const pd=planDay(wd), k=addDays(weekKey(t),(wd+6)%7), done=!!(S.days[k]||{}).treino;
    if(!pd){h+=`<button class="dayrow rest ${wd===twd?"today":""}" data-x="day-open" data-wd="${wd}"><span class="dl">${WD[wd]}</span><span class="t"><b>Descanso</b><small>toque para adicionar um treino</small></span></button>`;return}
    h+=`<button class="dayrow ${wd===twd?"today":""} ${done?"done":""}" data-x="day-open" data-wd="${wd}"><span class="dl">${done?"✓":WD[wd]}</span><span class="t"><b>${esc(pd.nome)}</b><small>${pd.ex.length} exercícios · ~${estMin(pd.ex)} min</small></span><span class="ths">${pd.ex.slice(0,3).map(it=>thumbHTML(it,true)).join("")}</span></button>`});
  h+=`</div>`;
  const tp=planDay(twd);
  if(tp&&tp.ex.length&&!W)h+=`<button class="btn pink big full" style="margin-top:12px" data-x="w-start" data-wd="${twd}">Começar o treino de hoje ▶</button>`;
  h+=`<div class="sec"><h2>Exercícios</h2><small>${EXERCICIOS.length} com vídeo</small></div><button class="card libcard" data-x="lib-open"><span class="ths">${["elev_pelvica","puxada_frente","agach_livre","elev_lateral"].map(e=>thumbHTML({e},true)).join("")}</span><span class="t"><b>Biblioteca de exercícios</b><small>Vídeos de professores ensinando a execução certa</small></span></button>`;
  /* histórico e recordes */
  const hist=Object.keys(S.days).sort().reverse().filter(k=>S.days[k].tlog).slice(0,5);
  if(hist.length){h+=`<div class="sec"><h2>Últimos treinos</h2></div><div class="card">${hist.map(k=>{const l=S.days[k].tlog,ns=(l.ex||[]).reduce((a,x)=>a+x.sets.length,0),vol=(l.ex||[]).reduce((a,x)=>a+x.sets.reduce((b,s)=>b+(+s[0]||0)*(+s[1]||0),0),0);
    return `<div class="sweet"><div><b>${esc(l.nome||"Treino")}</b><small>${fmtDay(k)} · ${ns} séries${l.dur?` · ${l.dur} min`:""}</small></div><span class="kcal low">${vol?Math.round(vol).toLocaleString("pt-BR")+" kg":"✓"}</span></div>`}).join("")}</div>`;
    const bests={};Object.values(S.days).forEach(d=>{(d.tlog&&d.tlog.ex||[]).forEach(x=>{const m=maxKg(x.sets);if(m>(bests[x.e]||0))bests[x.e]=m})});
    const top=Object.entries(bests).sort((a,b)=>b[1]-a[1]).slice(0,6);
    if(top.length)h+=`<div class="sec"><h2>Recordes</h2><small>maior carga</small></div><div class="card">${top.map(([e,m])=>`<div class="sweet"><div><b>${esc(exInfo(e).nome)}</b></div><span class="kcal mid">${kg(m).replace(",0","")} kg</span></div>`).join("")}</div>`}
  return h;
}

function openDay(wd){
  const pd=planDay(wd);
  if(!pd){openEditor({who:"me",wd,nome:"",list:[]});return}
  dayCtx={who:"me",wd,list:pd.ex};
  openSheet(`<h2>${esc(pd.nome)}</h2><div class="sub">${WDL[wd]} · ${pd.ex.length} exercícios · ~${estMin(pd.ex)} min${P().plano&&P().plano.prof&&!pd.auto?" · do seu professor":""}</div>
    <div class="exlist">${pd.ex.map((it,i)=>exRowHTML(it,i)).join("")}</div>
    ${pd.ex.length?`<button class="btn pink big full" data-x="w-start" data-wd="${wd}">Começar treino ▶</button>`:""}
    <button class="btn full" data-x="ed-open" data-wd="${wd}">Editar exercícios</button>
    <button class="btn ghost full" data-close="1">Fechar</button>`);
}
let dayCtx=null;
function openExView(it,back){
  const x=exInfo(it.e), b=bestKg(it.e), last=logsOf(it.e)[0];
  const pro=MODE==="pro";
  openSheet(`${videoBlock(it)}<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${grupoTag(x.grupo)}${x.equip?`<span class="tip">${esc(x.equip)}</span>`:""}</div><h2>${esc(x.nome)}</h2>
    ${it.s?`<div class="sub">${fmtEx(it)}</div>`:""}${it.o?`<div class="pnote"><b>Professor:</b> ${esc(it.o)}</div>`:""}
    ${x.dicas.length?`<div class="card stack"><b style="font-family:var(--f-game);font-weight:400;font-size:17px">Como fazer</b><ol class="tips">${x.dicas.map(d=>`<li>${esc(d)}</li>`).join("")}</ol>${x.erro?`<div class="err"><b>Erro comum:</b> ${esc(x.erro)}</div>`:""}</div>`:""}
    ${!pro&&(b||last)?`<div class="tip">${b?`Seu recorde: <b style="color:var(--yellow)">${kg(b).replace(",0","")} kg</b>. `:""}${last?`Última vez (${fmtDay(last.k)}): ${last.sets.map(s=>`${s[0]||0}kg×${s[1]||0}`).join(", ")}`:""}</div>`:""}
    ${pro&&EXM[it.e]?`<label class="f" for="myvid">MEU VÍDEO PARA ESTE EXERCÍCIO (LINK DO YOUTUBE)<input type="text" id="myvid" placeholder="https://youtube.com/watch?v=..." value="${esc((PRO.videos||{})[it.e]||"")}"></label><button class="btn full" data-x="myvid-save" data-e="${esc(it.e)}">Usar meu vídeo para todos os alunos</button>`:""}
    <button class="btn ghost full" ${back?`data-x="${back}"`:`data-close="1"`}>Voltar</button>`);
}

/* biblioteca */
let lib={q:"",g:"",mode:"ver"};
function openLibrary(mode){lib={q:"",g:"",mode:mode||"ver"};
  openSheet(`<h2>${lib.mode==="pick"?"Adicionar exercícios":"Biblioteca de exercícios"}</h2><div class="sub">${lib.mode==="pick"?"Toque para adicionar. Pode escolher vários.":"Toque num exercício para ver o vídeo e as dicas."}</div>
    <input type="text" id="lib-q" placeholder="Buscar: agachamento, remada..." aria-label="Buscar exercício" autocomplete="off">
    <div class="seg gseg">${[["","Todos"]].concat(Object.entries(GRUPOS).filter(([g])=>g!=="outro").map(([g,v])=>[g,v[0]])).map(([g,l])=>`<button data-x="lib-g" data-g="${g}" class="${lib.g===g?"on":""}">${l}</button>`).join("")}</div>
    <div class="exlist" id="lib-list"></div>
    ${lib.mode==="pick"?`<div class="grid2"><button class="btn" data-x="lib-custom">Outro exercício</button><button class="btn green" data-x="ed-back">Concluir</button></div>`:`<button class="btn ghost full" data-close="1">Fechar</button>`}`);
  renderLib();
}
function renderLib(){const el=$("#lib-list");if(!el)return;const q=norm(lib.q);
  const list=EXERCICIOS.map(a=>EXM[a[0]]).filter(x=>(!lib.g||x.grupo===lib.g)&&(!q||norm(x.nome+" "+x.equip+" "+GRUPOS[x.grupo][0]).includes(q)));
  el.innerHTML=list.length?list.map(x=>{const inEd=lib.mode==="pick"&&ED&&ED.list.some(it=>it.e===x.id);
    return `<button class="exrow ${inEd?"added":""}" data-x="${lib.mode==="pick"?"lib-add":"lib-view"}" data-e="${x.id}">${thumbHTML({e:x.id},true)}<span class="t"><b>${esc(x.nome)}</b><small>${GRUPOS[x.grupo][0]} · ${esc(x.equip)}</small></span><span class="n">${lib.mode==="pick"?(inEd?"✓":"+"):"›"}</span></button>`}).join("")
    :`<div class="tip" style="padding:10px">Nada encontrado. ${lib.mode==="pick"?"Use “Outro exercício” para criar.":""}</div>`;
}

/* editor de treino (aluno e professor usam o mesmo) */
let ED=null;
function openEditor(ctx){ED=ctx;ED.list=(ctx.list||[]).map(it=>({...it}));renderEditor()}
function renderEditor(){
  const pro=ED.who==="aluno";
  openSheet(`<h2>${pro?"Treino de "+WDL[ED.wd]:"Editar treino"}</h2><div class="sub">${pro?esc((curAluno()||{}).nome||""):WDL[ED.wd]}</div>
    <label class="f" for="ed-nome">NOME DO TREINO<input type="text" id="ed-nome" placeholder="ex.: Glúteos, Costas e bíceps" value="${esc(ED.nome||"")}"></label>
    ${ED.list.length?"":`<div class="tip">Dê um nome (ex.: “Glúteos”) e toque em “Montar pelo nome”, ou adicione os exercícios um por um.</div>`}
    <div class="stack">${ED.list.map((it,i)=>{const x=exInfo(it.e);return `<div class="exed">
      <div class="top">${thumbHTML(it,true)}<b>${esc(x.nome)}</b><span class="ord"><button data-x="ed-up" data-i="${i}" aria-label="Subir" ${i?"":"disabled"}>↑</button><button data-x="ed-down" data-i="${i}" aria-label="Descer" ${i<ED.list.length-1?"":"disabled"}>↓</button><button data-x="ed-del" data-i="${i}" aria-label="Remover">✕</button></span></div>
      <div class="g4"><label class="f">SÉRIES<input type="number" inputmode="numeric" id="ed-s-${i}" value="${esc(it.s)}"></label><label class="f">REPS<input type="text" id="ed-r-${i}" value="${esc(it.r)}"></label><label class="f">DESCANSO (S)<input type="number" inputmode="numeric" id="ed-d-${i}" value="${esc(it.d)}"></label><label class="f">CARGA<input type="text" id="ed-c-${i}" placeholder="ex.: 20 kg" value="${esc(it.c||"")}"></label></div>
      <input type="text" id="ed-o-${i}" placeholder="${pro?"Observação para o aluno (ex.: cadência 3s na descida)":"Anotação (opcional)"}" value="${esc(it.o||"")}" aria-label="Observação">
      ${pro?`<input type="text" id="ed-v-${i}" placeholder="Seu vídeo do YouTube (opcional)" value="${esc(it.v||"")}" aria-label="Link do vídeo">`:""}</div>`}).join("")}</div>
    <div class="grid2"><button class="btn" data-x="ed-add">+ Exercício</button><button class="btn" data-x="ed-auto">Montar pelo nome</button></div>
    <button class="btn green big full" data-x="ed-save">Salvar treino</button>
    <div class="grid2"><button class="btn ghost" data-x="ed-cancel">Cancelar</button><button class="btn ghost" data-x="ed-rest" style="color:var(--red)">Virar descanso</button></div>`);
}
function edCollect(){if(!ED)return;const g=id=>$("#"+id);const n=g("ed-nome");if(n)ED.nome=n.value.trim();
  ED.list=ED.list.map((it,i)=>{if(!g("ed-s-"+i))return it;const s=Math.max(1,Math.min(10,parseInt(g("ed-s-"+i).value)||3));
    return {...it,s,r:g("ed-r-"+i).value.trim()||"12",d:Math.max(0,Math.min(600,parseInt(g("ed-d-"+i).value)||0)),c:g("ed-c-"+i).value.trim(),o:g("ed-o-"+i).value.trim(),v:g("ed-v-"+i)?g("ed-v-"+i).value.trim():it.v||""}})}
function edSave(rest){
  edCollect();
  if(!rest&&!ED.nome){toast("Dê um nome ao treino");return}
  if(!rest&&!ED.list.length){toast("Adicione pelo menos um exercício");return}
  if(ED.who==="me"){const p=S.profile;p.treinos={...(p.treinos||DEFAULT_TREINOS)};p.plano=p.plano||{};p.plano.treinos=p.plano.treinos||{};
    if(rest){p.treinos[ED.wd]="";delete p.plano.treinos[ED.wd]}else{p.treinos[ED.wd]=ED.nome;p.plano.treinos[ED.wd]={nome:ED.nome,ex:ED.list}}
    saveProfile();closeSheet();render();toast(rest?"Virou dia de descanso":"Treino salvo")}
  else{const al=curAluno();if(!al)return;al.plano=al.plano||{treinos:{}};
    if(rest)delete al.plano.treinos[ED.wd];else al.plano.treinos[ED.wd]={nome:ED.nome,ex:ED.list};
    al.mudou=Date.now();proSave();closeSheet();render();toast(rest?"Dia de descanso":"Treino salvo")}
  ED=null;
}

/* treino guiado */
let W=null, restInt=null;
try{W=JSON.parse(localStorage.getItem("focofit.workout")||"null");if(W&&W.k!==todayKey()&&W.k<addDays(todayKey(),-1))W=null}catch(e){W=null}
const wSave=()=>{try{W?localStorage.setItem("focofit.workout",JSON.stringify(W)):localStorage.removeItem("focofit.workout")}catch(e){}};
function startWorkout(wd){
  const pd=planDay(wd); if(!pd||!pd.ex.length){toast("Esse dia não tem exercícios");return}
  if(W&&W.wd===wd&&W.k===todayKey()){renderPlayer();return}
  W={k:todayKey(),wd,nome:pd.nome,list:pd.ex.map(it=>({...it})),i:0,sets:{},ini:Date.now(),rest:null};
  W.list.forEach((it,i)=>{const last=logsOf(it.e,W.k)[0];W.sets[i]=Array.from({length:+it.s||3},(_,n)=>{const ls=last&&(last.sets[n]||last.sets[last.sets.length-1]);return {kg:ls?String(ls[0]||""):String(num(it.c)||""),r:String(lowReps(it.r)),ok:false}})});
  wSave(); keepAwake(); renderPlayer(); ding("small");
}
function wHint(it){
  const last=logsOf(it.e,W.k)[0]; if(!last)return "";
  const top=topReps(it.r), all=last.sets.length>=(+it.s||3)&&last.sets.every(s=>(+s[1]||0)>=top&&top>0);
  return all?`<div class="hint up"><b>Hora de evoluir!</b> Na última vez você fez todas as repetições. Tente subir 1 a 2 kg hoje.</div>`
    :`<div class="hint">Última vez: ${last.sets.map(s=>`${s[0]||0} kg × ${s[1]||0}`).join(" · ")}</div>`;
}
function renderPlayer(){
  if(!W)return; const it=W.list[W.i], x=exInfo(it.e), sets=W.sets[W.i]||[], doneEx=W.list.filter((_,i)=>(W.sets[i]||[]).every(s=>s.ok)).length;
  const last=W.i===W.list.length-1;
  $("#layer").innerHTML=`<div class="wk" role="dialog" aria-modal="true" aria-label="Treino"><div class="wk-in">
    <div class="wk-top"><button data-x="w-min" aria-label="Minimizar">✕</button><div class="prog"><i style="width:${Math.round(doneEx/W.list.length*100)}%"></i></div><span>${W.i+1}/${W.list.length}</span></div>
    ${videoBlock(it)}
    <div class="wk-h">${grupoTag(x.grupo)}<h2>${esc(x.nome)}</h2><p>${fmtEx(it)}</p></div>
    ${it.o?`<div class="pnote"><b>Professor:</b> ${esc(it.o)}</div>`:""}
    ${wHint(it)}
    <div class="sets"><div class="sh"><span>SÉRIE</span><span>CARGA (KG)</span><span>REPS</span><span></span></div>
      ${sets.map((s,n)=>`<div class="set ${s.ok?"ok":""}"><span class="sn">${n+1}</span><input type="number" inputmode="decimal" step="0.5" id="wkg-${n}" value="${esc(s.kg)}" placeholder="kg" aria-label="Carga da série ${n+1}"><input type="number" inputmode="numeric" id="wr-${n}" value="${esc(s.r)}" placeholder="reps" aria-label="Repetições da série ${n+1}"><button class="chk" data-x="w-set" data-n="${n}" aria-label="Série ${n+1} feita">${CHECK}</button></div>`).join("")}
      <button class="mini" data-x="w-addset">+ série</button></div>
    ${x.dicas.length?`<details class="how"><summary>Como fazer</summary><ol class="tips">${x.dicas.map(d=>`<li>${esc(d)}</li>`).join("")}</ol>${x.erro?`<div class="err"><b>Erro comum:</b> ${esc(x.erro)}</div>`:""}</details>`:""}
    <div class="wk-nav"><button class="btn" data-x="w-prev" ${W.i?"":"disabled"} aria-label="Exercício anterior">‹</button>${last?`<button class="btn green big" data-x="w-finish">Finalizar treino</button>`:`<button class="btn pink big" data-x="w-next">Próximo: ${esc(exInfo(W.list[W.i+1].e).nome)} ›</button>`}</div>
    <div class="wk-list">${W.list.map((t,i)=>`<button data-x="w-go" data-i="${i}" class="${i===W.i?"on":""} ${(W.sets[i]||[]).every(s=>s.ok)?"ok":""}">${thumbHTML(t,true)}<span>${esc(exInfo(t.e).nome)}</span></button>`).join("")}</div>
    ${last?"":`<button class="btn ghost full" data-x="w-finish">Encerrar treino agora</button>`}
  </div><div id="rest"></div></div>`;
  if(W.rest&&W.rest.end>Date.now())showRest(); else W.rest=null;
}
function wCollect(){if(!W)return;(W.sets[W.i]||[]).forEach((s,n)=>{const a=$("#wkg-"+n),b=$("#wr-"+n);if(a)s.kg=a.value;if(b)s.r=b.value});wSave()}
function showRest(){
  const el=$("#rest"); if(!el||!W||!W.rest)return;
  const nx=W.rest.next!=null?exInfo(W.list[W.rest.next].e).nome:"";
  el.innerHTML=`<div class="restov"><div class="timer"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#43307F" stroke-width="10"/><circle id="rest-ring" cx="60" cy="60" r="52" fill="none" stroke="#3CDCF7" stroke-width="10" stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg>
    <div class="c"><b id="rest-t">0</b><span>descanso</span></div></div>${nx?`<p>Próximo: <b style="color:var(--ink)">${esc(nx)}</b></p>`:"<p>Respire fundo. Beba água.</p>"}
    <div class="row-end" style="justify-content:center"><button class="btn" data-x="rest-add">+15s</button><button class="btn cyan" data-x="rest-skip">Pular descanso</button></div></div>`;
  clearInterval(restInt); restInt=setInterval(tickRest,250); tickRest();
}
function tickRest(){
  if(!W||!W.rest){clearInterval(restInt);return}
  const left=Math.max(0,W.rest.end-Date.now()), t=$("#rest-t"), r=$("#rest-ring");
  if(t)t.textContent=Math.ceil(left/1000); if(r)r.setAttribute("stroke-dashoffset",(326.7*(1-left/(W.rest.dur*1000))).toFixed(1));
  if(left<=0)endRest(true);
}
function endRest(alarm){clearInterval(restInt);restInt=null;if(!W)return;const nx=W.rest&&W.rest.next;W.rest=null;
  if(alarm){ding("big");buzz([180,90,180])}
  if(nx!=null){W.i=nx;wSave();renderPlayer();window.scrollTo(0,0)}else{const el=$("#rest");if(el)el.innerHTML="";wSave()}}
function wSet(n){
  wCollect(); const sets=W.sets[W.i], s=sets[n]; s.ok=!s.ok;
  if(s.ok){ding("small");buzz(25);sets.forEach((x,j)=>{if(j>n&&!x.ok&&!String(x.kg).trim())x.kg=s.kg});
    const allDone=sets.every(x=>x.ok), lastEx=W.i===W.list.length-1, d=+W.list[W.i].d||0;
    if(!(allDone&&lastEx)&&d>0)W.rest={end:Date.now()+d*1000,dur:d,next:allDone&&!lastEx?W.i+1:null};
    else if(allDone&&!lastEx){W.i++;}
  }
  wSave(); renderPlayer();
  if(W&&W.rest)showRest();
}
function finishWorkout(){
  wCollect(); clearInterval(restInt);
  const ex=W.list.map((it,i)=>({e:it.e,sets:(W.sets[i]||[]).filter(s=>s.ok).map(s=>[num(s.kg)||0,parseInt(s.r)||0])})).filter(x=>x.sets.length);
  if(!ex.length){openSheet(`<h2>Encerrar sem séries?</h2><div class="sub">Você não marcou nenhuma série. Quer sair do treino mesmo assim?</div><div class="row-end"><button class="btn ghost" data-x="w-resume">Voltar ao treino</button><button class="btn" data-x="w-discard">Sair</button></div>`);return}
  const k=W.k, before=dayInfo(k).xp, dur=Math.max(1,Math.round((Date.now()-W.ini)/60000));
  const prs=ex.map(x=>{const prev=bestKg(x.e,k),m=maxKg(x.sets);return prev&&m>prev?{e:x.e,m,d:m-prev}:null}).filter(Boolean);
  const vol=ex.reduce((a,x)=>a+x.sets.reduce((b,s)=>b+s[0]*s[1],0),0), ns=ex.reduce((a,x)=>a+x.sets.length,0);
  const d=day(k); d.tlog={wd:W.wd,nome:W.nome,dur,ex}; d.treino=true; saveDay(k);
  W=null; wSave(); try{wake&&wake.release()}catch(e){}
  const gained=dayInfo(k).xp-before;
  openFull(`<div class="glow">${avatarSVG(S.profile.avatar,stageOf(levelOf(computeAll().xp).L),false)}</div><h2 style="color:var(--green)">Treino concluído!</h2>
    <p>${gained>0?`+${gained} XP. `:""}${prs.length?"E você bateu recorde!":"Disciplina é isso: aparecer e fazer."}</p>
    <div class="stats" style="width:100%"><div><b>${dur}</b><span>minutos</span></div><div><b>${ns}</b><span>séries</span></div><div><b>${vol>=1000?(vol/1000).toFixed(1).replace(".",",")+"t":Math.round(vol)}</b><span>${vol>=1000?"toneladas":"kg levantados"}</span></div></div>
    ${prs.length?`<div class="card stack" style="width:100%;text-align:left">${prs.map(p=>`<div class="sweet"><div><b>${esc(exInfo(p.e).nome)}</b><small>novo recorde</small></div><span class="kcal low">${kg(p.m).replace(",0","")} kg (+${kg(p.d).replace(",0","")})</span></div>`).join("")}</div>`:""}
    <button class="btn green big" data-close="1">Fechar</button>`);
  $(".fs .glow svg").style.cssText="width:140px;height:163px";confetti(prs.length?220:150);ding("big");buzz([30,40,30]);jumpNext=true;
}

/* relatório da semana para o professor */
let relHumor=0;
function weekStats(){
  const t=todayKey(),rows=[];let good=0,mains=0,tp=0,tf=0,cm=0,cc=0,ag=0;
  for(let n=6;n>=0;n--){const k=addDays(t,-n),i=dayInfo(k),d=S.days[k]||{};rows.push([k,i.good,i.mains,i.treinoDia?1:0,d.treino?1:0,d.cardio||0,d.agua||0,d.doce?1:0]);
    good+=i.good;mains+=i.mains;tp+=i.treinoDia?1:0;tf+=(d.treino&&i.treinoDia)?1:0;cm+=d.cardio||0;cc+=d.cardio?1:0;ag+=d.agua||0}
  return {rows,dieta:mains?Math.round(good/mains*100):0,tp,tf,cm,cc,agua:Math.round(ag/7*10)/10};
}
function openReport(){
  const s=weekStats(), pl=P().plano||{};
  relHumor=relHumor||0;
  openSheet(`<h2>Relatório da semana</h2><div class="sub">Vai para ${pl.prof?"o prof. "+esc(pl.prof.nome):"seu professor"} com seus últimos 7 dias.</div>
    <div class="stats"><div><b>${s.dieta}%</b><span>dieta</span></div><div><b>${s.tf}/${s.tp}</b><span>treinos</span></div><div><b>${s.cm}</b><span>min cardio</span></div></div>
    <div class="f">COMO FOI SUA SEMANA?<div class="humor">${["😫","😕","😐","🙂","🤩"].map((e,i)=>`<button data-x="rel-h" data-h="${i+1}" class="${relHumor===i+1?"on":""}" aria-label="Nota ${i+1}">${e}</button>`).join("")}</div></div>
    <label class="f" for="rel-nt">QUER CONTAR ALGO? (DOR, DIFICULDADE, VITÓRIA)<textarea id="rel-nt" rows="3" placeholder="ex.: senti o joelho no búlgaro; consegui fazer cardio 3x!"></textarea></label>
    <button class="btn green big full" data-x="rel-send">${pl.prof&&pl.prof.whats?"Enviar no WhatsApp":"Gerar link do relatório"}</button>
    <button class="btn full" data-x="rel-copy">Copiar link</button>
    <button class="btn ghost full" data-close="1">Fechar</button>`);
}
async function reportLink(){
  const p=S.profile, pl=p.plano||{}, s=weekStats(), A=computeAll(), t=todayKey();
  const cl={};Object.keys(S.days).filter(k=>k>addDays(t,-7)).forEach(k=>{(S.days[k].tlog&&S.days[k].tlog.ex||[]).forEach(x=>{cl[x.e]=Math.max(cl[x.e]||0,maxKg(x.sets))})});
  const nt=($("#rel-nt")||{}).value||"";
  const o={t:"r",v:1,id:pl.aluno||"",n:pl.alunoNome||p.avatar.nome||"Aluno",ts:Date.now(),d:s.rows,
    w:(p.pesos||[]).slice().sort((a,b)=>a.d<b.d?-1:1).slice(-5).map(w=>[w.d,w.kg]),st:A.streak,lv:levelOf(A.xp).L,am:aguaMeta(),cm:cardioMeta(),
    cl:Object.entries(cl).map(([e,m])=>[e,m,bestKg(e,addDays(t,-6))]),nt:nt.slice(0,400),hu:relHumor};
  return {url:SITE+"#r="+await packCode(o),s};
}
const SITE="https://nandatobias56.github.io/FOCO_FIT/";
/* empacota dados num link curto: JSON comprimido em base64 */
const b64u = u8=>{let s="";for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const ub64 = s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
async function packCode(o){
  const raw=new TextEncoder().encode(JSON.stringify(o));
  try{if(window.CompressionStream){const z=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());return "z"+b64u(z)}}catch(e){}
  return "j"+b64u(raw);
}
async function unpackCode(c){
  c=codeOf(c);
  const kind=c[0], u=ub64(c.slice(1));
  const raw=kind==="z"?new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer()):u;
  return JSON.parse(new TextDecoder().decode(raw));
}
function copyText(txt,msg){return navigator.clipboard.writeText(txt).then(()=>{toast(msg||"Copiado");return true},()=>{openSheet(`<h2>Copie o texto</h2><textarea rows="6" id="cp-t">${esc(txt)}</textarea><button class="btn ghost full" data-close="1">Fechar</button>`);const t=$("#cp-t");t.focus();t.select();return false})}

/* plano recebido do professor */
function planPreviewHTML(o){
  const tr=Object.entries(o.tr||{}).sort((a,b)=>((+a[0]+6)%7)-((+b[0]+6)%7));
  return `<div class="card stack" style="text-align:left;width:100%">
    ${tr.length?`<div><b style="font-family:var(--f-game);font-weight:400;font-size:17px">Treino · ${tr.length} dias</b>${tr.map(([wd,[nome,ex]])=>`<div class="sweet"><div><b>${WD[wd]} · ${esc(nome)}</b></div><span class="tip">${ex.length} exercícios</span></div>`).join("")}</div>`:""}
    ${o.di?`<div><b style="font-family:var(--f-game);font-weight:400;font-size:17px">Dieta · ${o.di.length} refeições${o.mt&&o.mt.k?` · ${o.mt.k} kcal`:""}</b><div class="tip">${o.di.map(m=>esc(m[0]+" "+m[1])).join(" · ")}</div></div>`:""}
    ${o.mt?`<div class="tip">Metas: ${o.mt.a||8} copos de água${o.mt.cm?` · cardio ${o.mt.cm} min, ${o.mt.cs||3}x na semana`:""}${o.mt.pm?` · peso meta ${kg(+o.mt.pm)} kg`:""}</div>`:""}</div>`;
}
let incoming=null;
function showIncomingPlan(o){
  incoming=o;
  const andr=!FFN&&/android/i.test(navigator.userAgent);
  openFull(`<div class="pi big">${esc(((o.pf&&o.pf[0])||"P")[0].toUpperCase())}</div><h2>Seu plano chegou!</h2>
    <p>O prof. <b style="color:var(--ink)">${esc(o.pf&&o.pf[0]||"")}</b> montou um plano para ${esc(o.n||"você")}.</p>
    ${o.m?`<div class="pnote" style="width:100%;text-align:left">“${esc(o.m)}”</div>`:""}
    ${planPreviewHTML(o)}
    <button class="btn green big full" data-x="plan-accept">Aceitar meu plano</button>
    ${andr?`<a class="btn full" href="intent://i/p/${incomingCode}#Intent;scheme=focofit;package=app.focofit.maria;end">Tenho o app Android: abrir nele</a>`:""}
    <button class="btn ghost full" data-x="plan-later">Agora não</button>
    <p style="font-size:12px">${S.profile?"Seu XP, sequência e histórico continuam. Troco só treino, dieta e metas.":"Primeiro você escolhe seu personagem, depois o plano já entra pronto."}</p>`);
}
let incomingCode="";
function applyPlan(o){
  const p=S.profile, tre={0:"",1:"",2:"",3:"",4:"",5:"",6:""}, pt={};
  Object.entries(o.tr||{}).forEach(([wd,[nome,ex]])=>{tre[wd]=nome;pt[wd]={nome,ex:ex.map(a=>({e:a[0],s:a[1],r:a[2],d:a[3],c:a[4]||"",o:a[5]||"",v:a[6]||""}))}});
  if(Object.keys(pt).length)p.treinos=tre;
  p.plano={treinos:pt,prof:{nome:(o.pf&&o.pf[0])||"",whats:(o.pf&&o.pf[1])||"",cref:(o.pf&&o.pf[2])||""},aluno:o.id||"",alunoNome:o.n||"",msg:o.m||"",recebido:Date.now(),ts:o.ts,kcal:o.mt&&o.mt.k||null,macros:o.mt&&o.mt.mp?[o.mt.mp,o.mt.mc,o.mt.mg]:null};
  if(o.di&&o.di.length)p.dieta=normalizeMeals(o.di.map(([hora,nome,main,itens])=>({hora,nome,main:!!main,itens})));
  const mt=o.mt||{}; if(mt.a)p.aguaMeta=mt.a; if(mt.cm)p.cardioMeta=mt.cm; if(mt.cs)p.cardioSemana=mt.cs; if(mt.pm)p.pesoMeta=+mt.pm;
  const al=o.al||{}; if(al.th)p.treinoHora=al.th; if(al.ac)p.acordar=al.ac; if(al.nv)p.nivel=al.nv; if(al.o)p.objetivo=al.o;
  saveProfile();
}
function profileFromPlan(o){
  const al=o.al||{}, peso=num(al.p);
  S.profile={avatar:{type:draft.type,color:draft.color,skin:draft.skin,hair:draft.hair,hairStyle:draft.hairStyle,nome:draft.nome||"Você",hat:null,bg:null},criado:todayKey(),
    objetivo:al.o||"emagrecer",altura:num(al.a),idade:num(al.i),acordar:al.ac||"06:00",treinoHora:al.th||"18:00",restricoes:"",nivel:al.nv||"intermediario",
    pesoInicial:peso,pesoMeta:null,pesos:peso?[{d:todayKey(),kg:peso}]:[],treinos:{...DEFAULT_TREINOS},aguaMeta:8,cardioMeta:15,cardioSemana:3,som:true,dieta:o.di?null:templateMeals(al.o||"emagrecer",al.ac||"06:00")};
  applyPlan(o);
}
async function handleCode(code,fromLink){
  let o=null; try{o=await unpackCode(code)}catch(e){}
  if(!o||!o.t){toast("Código inválido. Peça um novo link.");return false}
  incomingCode=codeOf(code);
  if(o.t==="p"){
    if(MODE==="pro"&&PRO){openSheet(`<h2>Este é um plano de aluno</h2><div class="sub">Você está no modo professor. Quer abrir o app como aluno para receber este plano?</div><button class="btn pink full" data-x="plan-as-aluno">Usar como aluno</button><button class="btn ghost full" data-close="1">Cancelar</button>`);incoming=o;return true}
    showIncomingPlan(o);return true}
  if(o.t==="r"){
    if(MODE!=="pro"||!PRO){incoming=o;openSheet(`<h2>Relatório de ${esc(o.n||"aluno")}</h2><div class="sub">Este link é para o professor. Abra a área do professor para ver o relatório.</div><button class="btn pink full" data-x="rep-as-pro">Abrir área do professor</button><button class="btn ghost full" data-close="1">Fechar</button>`);return true}
    importReport(o);return true}
  return false;
}
function openCodeSheet(){openSheet(`<h2>Código do professor</h2><div class="sub">Cole o link ou o código que seu professor mandou.</div><textarea id="code-in" rows="4" placeholder="https://nandatobias56.github.io/FOCO_FIT/#p=..."></textarea><button class="btn pink big full" data-x="code-go">Abrir plano</button><button class="btn ghost full" data-close="1">Fechar</button>`)}

/* cliques da parte de treino e do professor */
document.addEventListener("input",e=>{
  if(e.target.id==="lib-q"){lib.q=e.target.value;renderLib()}
  if(W&&/^w(kg|r)-/.test(e.target.id))wCollect();
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-x]"); if(!b)return;
  const X=b.dataset, a=X.x;
  switch(a){
    case "play":playVideo(b);break;
    case "day-open":openDay(+X.wd);break;
    case "ex-view":if(dayCtx)openExView(dayCtx.list[+X.i],"day-back");break;
    case "day-back":if(dayCtx&&dayCtx.who==="me")openDay(dayCtx.wd);else closeSheet();break;
    case "lib-open":openLibrary(MODE==="pro"?"pro":"ver");break;
    case "lib-g":lib.g=X.g;b.parentNode.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));renderLib();break;
    case "lib-view":openExView({e:X.e},"lib-back");break;
    case "lib-back":{const m=lib.mode,q=lib.q,g=lib.g;openLibrary(m);lib.q=q;lib.g=g;const i=$("#lib-q");if(i)i.value=q;document.querySelectorAll(".gseg button").forEach(x=>x.classList.toggle("on",x.dataset.g===g));renderLib();break}
    case "lib-add":{if(!ED)break;const ix=ED.list.findIndex(it=>it.e===X.e);if(ix>=0){ED.list.splice(ix,1)}else{const pr=ED.who==="aluno"?(curAluno()||{}):P();const pp=exParams(pr.objetivo,pr.nivel,EXM[X.e].grupo);ED.list.push({e:X.e,s:pp.s,r:X.e==="prancha"?"30-40s":pp.r,d:pp.d,c:"",o:"",v:""});ding("small")}renderLib();break}
    case "lib-custom":openSheet(`<h2>Outro exercício</h2><label class="f" for="cx-n">NOME DO EXERCÍCIO<input type="text" id="cx-n" maxlength="40" placeholder="ex.: Cadeira adutora"></label><div class="row-end"><button class="btn ghost" data-x="ed-back">Voltar</button><button class="btn pink" data-x="cx-add">Adicionar</button></div>`);break;
    case "cx-add":{const n=($("#cx-n").value||"").trim();if(!n){toast("Escreva o nome");break}ED.list.push({e:"x:"+n.slice(0,40),s:3,r:"12",d:60,c:"",o:"",v:""});renderEditor();break}
    case "ed-open":{const pd=planDay(+X.wd);openEditor({who:"me",wd:+X.wd,nome:pd?pd.nome:"",list:pd?pd.ex:[]});break}
    case "ed-add":edCollect();openLibrary("pick");break;
    case "ed-back":renderEditor();break;
    case "ed-up":case "ed-down":{edCollect();const i=+X.i,j=a==="ed-up"?i-1:i+1;[ED.list[i],ED.list[j]]=[ED.list[j],ED.list[i]];renderEditor();break}
    case "ed-del":edCollect();ED.list.splice(+X.i,1);renderEditor();break;
    case "ed-auto":{edCollect();if(!ED.nome){toast("Escreva o nome do treino primeiro");break}const pr=ED.who==="aluno"?(curAluno()||{}):P();const g=genDay(ED.nome,{obj:pr.objetivo,nivel:pr.nivel});
      if(!g.length){toast("Não reconheci os músculos. Use nomes como Glúteos, Costas, Peito...");break}ED.list=g;renderEditor();toast("Montei "+g.length+" exercícios");break}
    case "ed-save":edSave(false);break;
    case "ed-rest":edSave(true);break;
    case "ed-cancel":ED=null;closeSheet();render();break;
    case "w-start":closeSheet();startWorkout(+X.wd);break;
    case "w-resume":closeSheet();if(W){renderPlayer();keepAwake()}break;
    case "w-min":wCollect();clearInterval(restInt);$("#layer").innerHTML="";render();break;
    case "w-set":wSet(+X.n);break;
    case "w-addset":wCollect();W.sets[W.i].push({kg:(W.sets[W.i].slice(-1)[0]||{}).kg||"",r:String(lowReps(W.list[W.i].r)),ok:false});wSave();renderPlayer();break;
    case "w-next":wCollect();if(W.i<W.list.length-1)W.i++;W.rest=null;wSave();renderPlayer();window.scrollTo(0,0);break;
    case "w-prev":wCollect();if(W.i>0)W.i--;W.rest=null;wSave();renderPlayer();break;
    case "w-go":wCollect();W.i=+X.i;W.rest=null;wSave();renderPlayer();break;
    case "w-finish":finishWorkout();break;
    case "w-discard":W=null;wSave();closeSheet();render();break;
    case "rest-add":if(W&&W.rest){W.rest.end+=15000;W.rest.dur+=15;wSave()}break;
    case "rest-skip":endRest(false);break;
    case "rel-open":openReport();break;
    case "rel-h":relHumor=+X.h;b.parentNode.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));break;
    case "rel-send":case "rel-copy":(async()=>{const r=await reportLink(),pl=P().plano||{};
      const txt=`Oi prof! Meu relatório da semana no Foco Fit:\n✅ Dieta ${r.s.dieta}% · 🏋️ ${r.s.tf}/${r.s.tp} treinos · 🏃 ${r.s.cm} min de cardio\n${r.url}`;
      if(a==="rel-send"&&pl.prof&&pl.prof.whats)openExt(waLink(pl.prof.whats,txt));else copyText(txt,"Relatório copiado. Cole no WhatsApp do professor.")})();break;
    case "code-open":openCodeSheet();break;
    case "code-go":{const v=($("#code-in")||{}).value||"";closeSheet();handleCode(v);break}
    case "plan-accept":{if(!incoming)break;const o=incoming;closeSheet();
      if(!S.profile){pendingPlan=o;setMode("aluno");obStep=1;render();toast("Escolha seu personagem");break}
      applyPlan(o);incoming=null;view.tab="treino";render();confetti(160);ding("big");toast("Plano aplicado!");try{history.replaceState(null,"",location.pathname)}catch(e){}break}
    case "plan-later":incoming=null;closeSheet();try{history.replaceState(null,"",location.pathname)}catch(e){}render();break;
    case "plan-as-aluno":{setMode("aluno");closeSheet();render();if(incoming)showIncomingPlan(incoming);break}
  }
});
