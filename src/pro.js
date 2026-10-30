/* ---------- modo professor ---------- */
let PRO=null, pendingPlan=null;
const LSP="focofit.pro";
try{PRO=JSON.parse(localStorage.getItem(LSP)||"null")}catch(e){PRO=null}
let MODE=(()=>{try{return localStorage.getItem("focofit.mode")||""}catch(e){return ""}})();
function setMode(m){MODE=m;try{localStorage.setItem("focofit.mode",m)}catch(e){}}
function proSave(){try{localStorage.setItem(LSP,JSON.stringify(PRO))}catch(e){}if(col)queue("pro",{pro:PRO})}
let pv={tab:"alunos",aluno:null,sub:"resumo"};
const curAluno = ()=>PRO&&pv.aluno?PRO.alunos.find(a=>a.id===pv.aluno):null;
const newId = ()=>"a"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const OBJ_TXT = o=>(OBJETIVOS.find(x=>x[0]===o)||[,"Emagrecer"])[1];
const PIC={
  alunos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  biblioteca:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>',
  perfil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
};

/* escolha inicial: aluno ou professor */
function renderRole(){
  $("#tabbar").hidden=true;
  $("#app").innerHTML=`<div class="stack role">
    <h1 style="font-size:34px;margin-top:10px">Foco <span style="color:var(--pink)">Fit</span></h1>
    <p style="margin:0;color:var(--muted)">Dieta, treino e cardio viram um jogo. Como você vai usar?</p>
    <button class="rolebtn" data-x="role-aluno"><span class="ri">${IC.gym}</span><span><b>Quero seguir meu plano</b><small>Treino guiado com vídeo, dieta, água e um personagem que evolui com você</small></span></button>
    <button class="rolebtn pro" data-x="role-pro"><span class="ri">${PIC.alunos}</span><span><b>Sou personal ou nutricionista</b><small>${CLOUD?"Com CREF ou CRN conferido: vincule seus alunos e acompanhe a semana de cada um":"Monte treino e dieta dos seus alunos, mande pelo WhatsApp e acompanhe a semana de cada um"}</small></span></button>
    <button class="btn ghost" data-x="code-open">Recebi um link do meu professor</button>
    ${CLOUD?`<button class="btn ghost" data-x="ct-open">${ME?"Minha conta":"Já tenho conta: entrar"}</button>`:""}</div>`;
}

/* status do aluno: semáforo */
const daysAgo = ts=>Math.floor((Date.now()-ts)/864e5);
function adesao(r){if(!r)return null;let g=0,m=0,tp=0,tf=0;(r.d||[]).forEach(x=>{g+=x[1];m+=x[2];tp+=x[3];tf+=x[3]&&x[4]?1:0});
  const di=m?g/m:0, tr=tp?tf/tp:1;return {di,tr,tot:Math.round((di*.6+tr*.4)*100),tp,tf,cm:(r.d||[]).reduce((a,x)=>a+x[5],0),cc:(r.d||[]).filter(x=>x[5]).length,ag:Math.round((r.d||[]).reduce((a,x)=>a+x[6],0)/7*10)/10,doce:(r.d||[]).filter(x=>x[7]).length}}
function statusOf(al){
  const r=(al.rel||[])[0];
  if(!al.enviado)return {c:"n",t:"Plano não enviado",o:2};
  if(!r)return daysAgo(al.enviado)>8?{c:"y",t:`Sem relatório há ${daysAgo(al.enviado)} dias`,o:1}:{c:"n",t:"Esperando o 1º relatório",o:3};
  const ag=daysAgo(r.ts), ad=adesao(r);
  if(ag>14)return {c:"r",t:`Sumiu há ${ag} dias`,o:0};
  if(ad.tot<50)return {c:"r",t:`Adesão baixa: ${ad.tot}%`,o:0};
  if(ag>8)return {c:"y",t:`Relatório de ${ag} dias atrás`,o:1};
  if(ad.tot<75)return {c:"y",t:`Atenção: ${ad.tot}%`,o:1};
  return {c:"g",t:`Em dia: ${ad.tot}%`,o:4};
}

/* tela principal do professor */
function renderPro(){
  if(!PRO){renderProSetup();return}
  $("#tabbar").hidden=false;
  const tabs=[["alunos","Alunos"],["biblioteca","Biblioteca"],["perfil","Perfil"]];
  $("#tabs").innerHTML=tabs.map(([id,l])=>`<button role="tab" aria-selected="${pv.tab===id&&!pv.aluno}" data-x="ptab" data-t="${id}">${PIC[id]}<span>${l}</span></button>`).join("");
  let h="";
  if(pv.aluno&&curAluno())h=renderAluno(curAluno());
  else{pv.aluno=null;
    h=`<header class="phead"><div class="pi">${esc((PRO.perfil.nome||"P")[0].toUpperCase())}</div><div><small>FOCO FIT PRO</small><b>Prof. ${esc(PRO.perfil.nome)}</b></div></header>`;
    if(pv.tab==="alunos")h+=renderAlunos();else if(pv.tab==="biblioteca")h+=renderBiblio();else h+=renderPerfil();}
  $("#app").innerHTML=h;
}
function renderProSetup(){
  $("#tabbar").hidden=true;
  $("#app").innerHTML=`<div class="stack">
    <h1 style="font-size:30px;margin-top:10px">Área do <span style="color:var(--cyan)">professor</span></h1>
    <div class="card stack feats">
      <div><i>1</i><span><b>Monte o plano em minutos</b>Treino com vídeo de cada exercício, séries, carga e descanso. Dieta calculada pelo objetivo do aluno.</span></div>
      <div><i>2</i><span><b>Mande por WhatsApp ou QR code</b>O aluno abre o link e o plano entra no app dele, pronto para usar.</span></div>
      <div><i>3</i><span><b>Acompanhe cada aluno</b>Ele te devolve o relatório da semana: dieta, treinos, cargas, peso e como se sentiu.</span></div></div>
    <div class="card stack"><label class="f" for="pf-n">SEU NOME<input type="text" id="pf-n" maxlength="30" placeholder="ex.: Carla Souza"></label>
      <label class="f" for="pf-w">SEU WHATSAPP (COM DDD)<input type="text" id="pf-w" inputmode="tel" placeholder="ex.: 11 99999-9999"></label>
      <label class="f" for="pf-c">CREF (OPCIONAL)<input type="text" id="pf-c" maxlength="20" placeholder="ex.: 012345-G/SP"></label></div>
    <button class="btn pink big full" data-x="pro-create">Criar minha área</button>
    <button class="btn ghost full" data-x="pro-exit">Voltar</button>
    <p class="note">Seus alunos e planos ficam guardados neste aparelho. Faça backup no Perfil de vez em quando.</p></div>`;
}
function renderAlunos(){
  const al=PRO.alunos.slice(), st=al.map(a=>({a,s:statusOf(a)})).sort((x,y)=>x.s.o-y.s.o||(x.a.nome<y.a.nome?-1:1));
  const ok=st.filter(x=>x.s.c==="g").length, att=st.filter(x=>x.s.c==="r"||x.s.c==="y").length;
  let h=`<div class="stats" style="margin-top:14px"><div><b>${al.length}</b><span>alunos</span></div><div><b style="color:var(--green)">${ok}</b><span>em dia</span></div><div><b style="color:${att?"var(--orange)":"var(--dim)"}">${att}</b><span>atenção</span></div></div>
    <div class="grid2" style="margin-top:12px"><button class="btn pink big" data-x="al-new">+ Novo aluno</button><button class="btn big" data-x="rep-paste">Receber relatório</button></div>`;
  if(!al.length)return h+`<div class="card stack" style="margin-top:14px;text-align:center"><div style="font-size:40px">👋</div><b style="font-family:var(--f-game);font-weight:400;font-size:20px">Cadastre seu primeiro aluno</b><div class="tip">Em 3 minutos você monta treino e dieta e manda pelo WhatsApp.</div></div>`;
  const groups=[["Precisa de atenção",st.filter(x=>x.s.c==="r"||x.s.c==="y")],["Em dia",st.filter(x=>x.s.c==="g")],["Começando",st.filter(x=>x.s.c==="n")]];
  groups.forEach(([t,l])=>{if(!l.length)return;h+=`<div class="sec"><h2>${t}</h2><small>${l.length}</small></div><div class="stack">`+l.map(({a,s})=>{const r=(a.rel||[])[0],ad=adesao(r);
    return `<button class="alcard" data-x="al-open" data-id="${a.id}"><span class="pi st-${s.c}">${esc((a.nome||"?")[0].toUpperCase())}</span><span class="t"><b>${esc(a.nome)}</b><small>${esc(OBJ_TXT(a.objetivo))}${a.dias&&a.dias.length?` · ${a.dias.length}x/semana`:""}</small><span class="stl st-${s.c}">${esc(s.t)}</span></span>
      ${ad?`<span class="mbars">${(r.d||[]).map(x=>`<i style="height:${Math.max(8,Math.round((x[2]?x[1]/x[2]:0)*100))}%" class="${x[3]&&x[4]?"tr":""}"></i>`).join("")}</span>`:""}</button>`}).join("")+`</div>`});
  return h;
}
function renderBiblio(){
  const mv=Object.keys(PRO.videos||{}).filter(k=>PRO.videos[k]).length;
  let h=`<div class="sec"><h2>Exercícios</h2><small>${EXERCICIOS.length} com vídeo</small></div>
    <button class="card libcard" data-x="lib-open"><span class="ths">${["bulgaro","remada_baixa","leg_press","triceps_corda"].map(e=>thumbHTML({e},true)).join("")}</span><span class="t"><b>Biblioteca de exercícios</b><small>${mv?mv+" com o seu vídeo":"Troque pelo vídeo do seu canal, se quiser"}</small></span></button>
    <div class="sec"><h2>Modelos de treino</h2><small>${(PRO.modelos||[]).length}</small></div>`;
  if(!(PRO.modelos||[]).length)h+=`<div class="card tip">Monte o treino de um aluno e toque em “Salvar como modelo”. Depois é só aplicar em outros alunos com 1 toque.</div>`;
  else h+=`<div class="card">${PRO.modelos.map(m=>`<div class="sweet"><div><b>${esc(m.nome)}</b><small>${Object.values(m.treinos).map(t=>esc(t.nome)).join(" · ")}</small></div><button class="mini" data-x="mod-del" data-id="${m.id}">apagar</button></div>`).join("")}</div>`;
  return h;
}
function renderPerfil(){
  const p=PRO.perfil;
  return `<div class="sec"><h2>Meus dados</h2></div><div class="card stack">
    <label class="f" for="pf-n">NOME<input type="text" id="pf-n" maxlength="30" value="${esc(p.nome)}"></label>
    <label class="f" for="pf-w">WHATSAPP<input type="text" id="pf-w" inputmode="tel" value="${esc(p.whats||"")}"></label>
    <label class="f" for="pf-c">CREF<input type="text" id="pf-c" maxlength="20" value="${esc(p.cref||"")}"></label>
    <button class="btn pink full" data-x="pf-save">Salvar</button></div>
    <div class="sec"><h2>App</h2></div><div class="card stack">
    ${CLOUD?`<button class="btn full" data-x="ct-open">Minha conta</button>`:""}
    <button class="btn full" data-x="pro-backup">Backup dos alunos</button>
    <button class="btn full" data-x="pro-exit">Usar o app como aluno(a)</button>
    ${FFN?`<button class="btn full" data-act="check-update">Procurar atualização</button>`:""}
    <button class="btn ghost full" style="color:var(--red)" data-x="pro-reset">Apagar área do professor</button></div>
    <p class="note">Os dados dos alunos ficam só neste aparelho e só saem quando você envia um plano.<br>A dieta sugerida pelo app é uma orientação geral: plano alimentar individual é função do nutricionista. Você pode colar a dieta do nutricionista do aluno.</p>`;
}

/* aluno */
function blankAluno(){return {id:newId(),nome:"",whats:"",sexo:"F",idade:"",altura:"",peso:"",meta:"",objetivo:"emagrecer",nivel:"intermediario",foco:"inferiores",dias:[1,2,3,4,5],acordar:"06:00",treinoHora:"18:00",restr:"",obs:"",
  plano:{treinos:{}},dieta:null,kcal:null,metas:{agua:8,cardio:20,cardioSemana:3},criado:Date.now(),rel:[]}}
let alDraft=null;
function alunoFormHTML(a){
  const dias=[1,2,3,4,5,6,0];
  return `<div class="stack">
    <label class="f" for="al-n">NOME<input type="text" id="al-n" maxlength="30" value="${esc(a.nome)}"></label>
    <label class="f" for="al-w">WHATSAPP<input type="text" id="al-w" inputmode="tel" placeholder="com DDD" value="${esc(a.whats)}"></label>
    <div class="f">SEXO<div class="seg">${[["F","Feminino"],["M","Masculino"]].map(([v,l])=>`<button data-x="af" data-k="sexo" data-v="${v}" class="${a.sexo===v?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="grid2"><label class="f" for="al-i">IDADE<input type="number" id="al-i" inputmode="numeric" value="${esc(a.idade)}"></label><label class="f" for="al-a">ALTURA (CM)<input type="number" id="al-a" inputmode="numeric" value="${esc(a.altura)}"></label>
      <label class="f" for="al-p">PESO (KG)<input type="number" id="al-p" inputmode="decimal" step="0.1" value="${esc(a.peso)}"></label><label class="f" for="al-m">META (KG)<input type="number" id="al-m" inputmode="decimal" step="0.1" value="${esc(a.meta)}"></label></div>
    <div class="f">OBJETIVO<div class="seg">${OBJETIVOS.map(([v,l])=>`<button data-x="af" data-k="objetivo" data-v="${v}" class="${a.objetivo===v?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="f">NÍVEL<div class="seg">${NIVEIS.map(([v,l])=>`<button data-x="af" data-k="nivel" data-v="${v}" class="${a.nivel===v?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="f">DIAS DE TREINO<div class="daychips">${dias.map(i=>`<button data-x="af-dia" data-d="${i}" class="${a.dias.includes(i)?"on":""}">${WD[i]}</button>`).join("")}</div></div>
    <div class="grid2"><label class="f" for="al-ac">ACORDA ÀS<input type="time" id="al-ac" value="${esc(a.acordar)}"></label><label class="f" for="al-th">TREINA ÀS<input type="time" id="al-th" value="${esc(a.treinoHora)}"></label></div>
    <label class="f" for="al-r">NÃO COME OU NÃO GOSTA<input type="text" id="al-r" placeholder="ex.: não come ovo de manhã, sem lactose" value="${esc(a.restr)}"></label>
    <label class="f" for="al-o">LESÕES OU OBSERVAÇÕES<input type="text" id="al-o" placeholder="ex.: dor no joelho esquerdo" value="${esc(a.obs)}"></label></div>`;
}
function alCollect(a){const v=id=>{const e=$("#"+id);return e?e.value.trim():null};const m={nome:"al-n",whats:"al-w",idade:"al-i",altura:"al-a",peso:"al-p",meta:"al-m",acordar:"al-ac",treinoHora:"al-th",restr:"al-r",obs:"al-o"};
  Object.entries(m).forEach(([k,id])=>{const x=v(id);if(x!==null)a[k]=x})}
function openAlunoForm(a,isNew){alDraft={...a,dias:a.dias.slice()};alDraft._new=isNew;
  openSheet(`<h2>${isNew?"Novo aluno":"Dados do aluno"}</h2>${alunoFormHTML(alDraft)}
    <button class="btn green big full" data-x="al-save">${isNew?"Cadastrar e montar o plano":"Salvar"}</button>
    ${isNew?"":`<button class="btn ghost full" data-x="al-del" style="color:var(--red)">Excluir aluno</button>`}<button class="btn ghost full" data-close="1">Cancelar</button>`)}
function refreshAlForm(){alCollect(alDraft);const sh=$(".sheet");if(!sh)return;const top=sh.scrollTop;openAlunoForm(alDraft,alDraft._new);const s2=$(".sheet");if(s2)s2.scrollTop=top}

function renderAluno(a){
  const s=statusOf(a), subs=[["resumo","Resumo"],["treino","Treino"],["dieta","Dieta"],["enviar","Enviar"]];
  let h=`<div class="atop"><button class="back" data-x="al-close" aria-label="Voltar">‹</button><span class="pi st-${s.c}">${esc((a.nome||"?")[0].toUpperCase())}</span><div class="t"><b>${esc(a.nome)}</b><small>${esc(OBJ_TXT(a.objetivo))} · ${esc((NIVEIS.find(n=>n[0]===a.nivel)||[,""])[1])}</small></div><button class="mini" data-x="al-edit">dados</button></div>
    <div class="seg subs">${subs.map(([id,l])=>`<button data-x="psub" data-s="${id}" class="${pv.sub===id?"on":""}">${l}</button>`).join("")}</div>`;
  if(pv.sub==="treino")h+=alTreino(a);else if(pv.sub==="dieta")h+=alDieta(a);else if(pv.sub==="enviar")h+=alEnviar(a);else h+=alResumo(a,s);
  return h;
}
function alResumo(a,s){
  const r=(a.rel||[])[0], ad=adesao(r);
  let h=`<div class="card status st-${s.c}"><b>${esc(s.t)}</b><span>${r?`Último relatório: ${fmtDay(keyOf(new Date(r.ts)))}`:a.enviado?`Plano enviado em ${fmtDay(keyOf(new Date(a.enviado)))}`:"Monte o treino e a dieta e envie para o aluno."}</span></div>`;
  if(!r){h+=`<div class="card stack" style="margin-top:12px"><b style="font-family:var(--f-game);font-weight:400;font-size:18px">Como acompanhar</b><ol class="tips"><li>Monte o <b>Treino</b> e a <b>Dieta</b>.</li><li>Na aba <b>Enviar</b>, mande o link pelo WhatsApp.</li><li>No fim da semana o aluno toca em “Enviar relatório” e você recebe aqui os dias, cargas e peso.</li></ol></div>`;
    if(!a.enviado)h+=`<button class="btn pink big full" style="margin-top:12px" data-x="psub" data-s="treino">Começar pelo treino</button>`;
    return h;}
  h+=`<div class="stats" style="margin-top:12px"><div><b>${Math.round(ad.di*100)}%</b><span>dieta</span></div><div><b>${ad.tf}/${ad.tp}</b><span>treinos</span></div><div><b>${ad.cm}</b><span>min cardio</span></div>
    <div><b>${ad.ag}</b><span>copos/dia</span></div><div><b>${r.st||0}</b><span>sequência</span></div><div><b>${ad.doce}</b><span>doces vencidos</span></div></div>`;
  h+=`<div class="sec"><h2>Semana</h2><small>dieta e treino por dia</small></div><div class="card"><div class="wbars">${(r.d||[]).map(x=>{const p=x[2]?x[1]/x[2]:0;
    return `<div><span class="bar"><i style="height:${Math.max(4,Math.round(p*100))}%;background:${p>=.75?"var(--green)":p>=.5?"var(--orange)":"var(--red)"}"></i></span><em class="${x[3]?(x[4]?"ok":"miss"):""}">${x[3]?(x[4]?"✓":"✕"):"·"}</em><small>${WD[dateOf(x[0]).getDay()]}</small></div>`}).join("")}</div>
    <div class="tip" style="margin-top:8px">Barra: refeições seguidas. ✓ treinou · ✕ faltou no dia de treino.</div></div>`;
  if(r.hu||r.nt)h+=`<div class="sec"><h2>Recado do aluno</h2></div><div class="card pnote" style="font-size:15px">${r.hu?`<span style="font-size:26px">${["😫","😕","😐","🙂","🤩"][r.hu-1]}</span> `:""}${r.nt?"“"+esc(r.nt)+"”":""}</div>`;
  if(r.w&&r.w.length){const f=r.w[0][1],l=r.w[r.w.length-1][1],dl=l-f;h+=`<div class="sec"><h2>Peso</h2></div><div class="card" style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-family:var(--f-game);font-weight:400;font-size:28px">${kg(l)} kg</b><span style="font-weight:900;color:${dl<0?"var(--green)":dl>0?"var(--orange)":"var(--muted)"}">${dl?(dl>0?"+":"−")+kg(Math.abs(dl))+" kg":"estável"}${a.meta?` · meta ${esc(a.meta)} kg`:""}</span></div>`}
  if(r.cl&&r.cl.length)h+=`<div class="sec"><h2>Cargas da semana</h2></div><div class="card">${r.cl.map(([e,m,p])=>`<div class="sweet"><div><b>${esc(exInfo(e).nome)}</b>${p?`<small>antes: ${kg(p).replace(",0","")} kg</small>`:""}</div><span class="kcal ${p&&m>p?"low":"mid"}">${kg(m).replace(",0","")} kg${p&&m>p?" ↑":""}</span></div>`).join("")}</div>`;
  const msgs=quickMsgs(a,r,ad);
  if(a.whats&&msgs.length)h+=`<div class="sec"><h2>Responder</h2><small>abre o WhatsApp</small></div><div class="stack">${msgs.map(m=>`<a class="qmsg" href="${waLink(a.whats,m)}" target="_blank" rel="noopener">${esc(m)}</a>`).join("")}</div>`;
  if((a.rel||[]).length>1)h+=`<div class="sec"><h2>Semanas anteriores</h2></div><div class="card">${a.rel.slice(1,6).map(x=>{const d=adesao(x);return `<div class="sweet"><div><b>${fmtDay(keyOf(new Date(x.ts)))}</b><small>dieta ${Math.round(d.di*100)}% · treinos ${d.tf}/${d.tp}</small></div><span class="kcal ${d.tot>=75?"low":d.tot>=50?"mid":"high"}">${d.tot}%</span></div>`}).join("")}</div>`;
  return h;
}
function quickMsgs(a,r,ad){
  const n=(a.nome||"").split(" ")[0], out=[];
  if(ad.tot>=80)out.push(`${n}, que semana! ${Math.round(ad.di*100)}% da dieta e ${ad.tf} treinos. Orgulho de você, continua assim! 💪`);
  else if(ad.tot>=50)out.push(`${n}, vi seu relatório: boa base, mas dá pra subir. Qual foi a refeição mais difícil essa semana? Vamos ajustar juntos.`);
  else out.push(`${n}, sumiu um pouquinho essa semana, né? Sem culpa. Me conta o que atrapalhou que eu adapto o plano pra caber na sua rotina.`);
  if(ad.tp&&ad.tf<ad.tp)out.push(`${n}, faltaram ${ad.tp-ad.tf} treinos. Se o horário está difícil, me fala qual dia funciona melhor que eu reorganizo a divisão.`);
  if(!ad.cc)out.push(`${n}, bora colocar só 10 minutos de cardio depois do treino essa semana? Começa pequeno que vira hábito.`);
  if(r.cl&&r.cl.some(([e,m,p])=>p&&m>p))out.push(`${n}, vi que você subiu carga! Isso é evolução de verdade. Mantém a técnica certinha. 🔥`);
  return out.slice(0,3);
}
function weekRows(a,act){
  let h=`<div class="card days">`;
  [1,2,3,4,5,6,0].forEach(wd=>{const t=a.plano.treinos[wd];
    if(!t){h+=`<button class="dayrow rest" data-x="${act}" data-wd="${wd}"><span class="dl">${WD[wd]}</span><span class="t"><b>Descanso</b><small>toque para criar um treino</small></span></button>`;return}
    h+=`<button class="dayrow" data-x="${act}" data-wd="${wd}"><span class="dl">${WD[wd]}</span><span class="t"><b>${esc(t.nome)}</b><small>${t.ex.length} exercícios · ~${estMin(t.ex)} min</small></span><span class="ths">${t.ex.slice(0,3).map(it=>thumbHTML(it,true)).join("")}</span></button>`});
  return h+`</div>`;
}
function alTreino(a){
  const has=Object.keys(a.plano.treinos).length;
  let h=`<div class="card stack" style="margin-top:12px"><b style="font-family:var(--f-game);font-weight:400;font-size:18px">${has?"Refazer automático":"Montar treino automático"}</b>
    <div class="f">FOCO<div class="seg">${FOCOS.map(([v,l])=>`<button data-x="gen-foco" data-v="${v}" class="${(a.foco||"equilibrado")===v?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="tip">${a.dias.length} dias (${a.dias.map(d=>WD[d]).join(", ")}) · ${esc(OBJ_TXT(a.objetivo).toLowerCase())} · ${esc((NIVEIS.find(n=>n[0]===a.nivel)||[,""])[1].toLowerCase())}. Você ajusta tudo depois.</div>
    <button class="btn ${has?"":"pink"} full" data-x="gen-week">${has?"Gerar de novo (substitui)":"Gerar treino da semana"}</button></div>
    <div class="sec"><h2>Semana</h2><small>toque para editar</small></div>${weekRows(a,"al-day")}
    <div class="grid2" style="margin-top:12px"><button class="btn" data-x="mod-save" ${has?"":"disabled"}>Salvar como modelo</button><button class="btn" data-x="mod-apply" ${(PRO.modelos||[]).length?"":"disabled"}>Aplicar modelo</button></div>`;
  if(a.obs)h+=`<div class="pnote" style="margin-top:12px"><b>Atenção:</b> ${esc(a.obs)}</div>`;
  if(has)h+=`<button class="btn pink big full" style="margin-top:12px" data-x="psub" data-s="dieta">Próximo: dieta ›</button>`;
  return h;
}

/* dieta: cálculo de calorias e cardápio */
function calcKcal(a){
  const p=num(a.peso),al=num(a.altura),i=num(a.idade); if(!p||!al||!i)return null;
  const tmb=Math.round(10*p+6.25*al-5*i+(a.sexo==="M"?5:-161));
  const n=(a.dias||[]).length, f=n>=5?1.55:n>=3?1.45:n>=1?1.375:1.2, get=Math.round(tmb*f);
  let meta=a.objetivo==="emagrecer"?Math.round(get*.8):a.objetivo==="massa"?Math.round(get*1.1):get;
  meta=Math.max(meta,Math.round(tmb*1.0)); if(a.kcal)meta=+a.kcal;
  const pg=Math.round(p*(a.objetivo==="saude"?1.6:2)), gg=Math.round(p*.8), cg=Math.max(0,Math.round((meta-pg*4-gg*9)/4));
  return {tmb,get,meta,pg,cg,gg,auto:!a.kcal};
}
const SHARE={cafe:.2,lanche:.1,almoco:.3,pre:.15,jantar:.25,ceia:.07};
function applyRestr(meals,restr){
  const r=norm(restr||""), semOvoCafe=/ovo/.test(r)&&/(cafe|manha)/.test(r), semOvo=/ovo/.test(r)&&!semOvoCafe, semLeite=/lactose|leite/.test(r), veg=/vegetarian|vegan|carne/.test(r);
  return meals.map(m=>({...m,itens:m.itens.map(x=>{const n=norm(x);
    if(/ovo/.test(n)&&(semOvo||(semOvoCafe&&m.tipo==="cafe")))return m.tipo==="cafe"?"2 fatias de queijo branco ou 1 iogurte natural":"1 porção de frango ou atum";
    if(semLeite&&/leite|iogurte|queijo/.test(n))return x.replace(/leite/i,"leite sem lactose").replace(/iogurte/i,"iogurte sem lactose").replace(/queijo branco/i,"queijo sem lactose");
    if(veg&&/carne|frango|peixe/.test(n))return "1 porção de proteína de soja, grão-de-bico ou 2 ovos";
    return x})}));
}
function genDieta(a){
  let ms=templateMeals(a.objetivo,a.acordar||"06:00");
  const th=horaNum(a.treinoHora||"18:00"), pre=ms.find(m=>m.tipo==="pre"); if(pre)pre.hora=fmtHora(Math.max(horaNum(pre.hora)-1,th-1.25));
  return normalizeMeals(applyRestr(ms,a.restr));
}
function alDieta(a){
  const c=calcKcal(a), ms=a.dieta||[];
  let h=`<div class="sec"><h2>Calorias</h2><small>Mifflin-St Jeor</small></div>`;
  if(!c)h+=`<div class="card stack"><div class="tip">Preencha peso, altura e idade para eu calcular as calorias e os macros.</div><button class="btn full" data-x="al-edit">Completar dados</button></div>`;
  else{const tot=c.pg*4+c.cg*4+c.gg*9;
    h+=`<div class="card stack"><div class="kc"><div><small>BASAL</small><b>${c.tmb}</b></div><div><small>GASTO/DIA</small><b>${c.get}</b></div><div class="m"><small>META</small><b>${c.meta}</b></div></div>
      <div class="macros"><div style="flex:${c.pg*4}" class="p"></div><div style="flex:${c.cg*4}" class="c"></div><div style="flex:${c.gg*9}" class="g"></div></div>
      <div class="mleg"><span><i class="p"></i>Proteína <b>${c.pg} g</b></span><span><i class="c"></i>Carbo <b>${c.cg} g</b></span><span><i class="g"></i>Gordura <b>${c.gg} g</b></span></div>
      <label class="f" for="kc-in">AJUSTAR META (KCAL)<input type="number" id="kc-in" inputmode="numeric" placeholder="${c.meta}" value="${a.kcal||""}"></label>
      <div class="tip">${a.objetivo==="emagrecer"?"Déficit de 20% sobre o gasto do dia.":a.objetivo==="massa"?"Superávit de 10% sobre o gasto do dia.":"Manutenção do peso."} ${tot!==c.meta?"":""}</div></div>`}
  h+=`<div class="sec"><h2>Cardápio</h2><small>${ms.length?ms.length+" refeições":"ainda vazio"}</small></div>`;
  if(!ms.length)h+=`<div class="card stack"><div class="tip">Comece por um modelo pelo objetivo (já respeitando “${esc(a.restr||"sem restrições")}”) ou cole a dieta do nutricionista.</div></div>`;
  else{const tot=ms.reduce((s,m)=>s+(SHARE[m.tipo]||.1),0);
    h+=`<div class="stack">${ms.map((m,i)=>`<div class="mealedit"><div class="me-top"><input type="time" id="pm-h-${i}" value="${esc(m.hora)}" aria-label="Horário"><input type="text" id="pm-n-${i}" value="${esc(m.nome)}" aria-label="Nome"><button class="mini" data-x="pm-del" data-i="${i}" aria-label="Remover">✕</button></div>
      <textarea id="pm-i-${i}" rows="${Math.max(2,m.itens.length)}" aria-label="Itens">${esc(m.itens.join("\n"))}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><label class="tgl"><input type="checkbox" id="pm-m-${i}" ${m.main?"checked":""}> Principal</label>${c?`<span class="tip">≈ ${Math.round(c.meta*(SHARE[m.tipo]||.1)/tot/10)*10} kcal</span>`:""}</div></div>`).join("")}</div>
      <button class="btn full" style="margin-top:8px" data-x="pm-add">+ Refeição</button>`}
  h+=`<div class="grid2" style="margin-top:8px"><button class="btn ${ms.length?"":"pink"}" data-x="pm-gen">${ms.length?"Refazer pelo objetivo":"Montar pelo objetivo"}</button><button class="btn" data-x="pm-paste">Colar dieta</button></div>`;
  const mt=a.metas||{};
  h+=`<div class="sec"><h2>Metas do aluno</h2></div><div class="card grid2">
    <label class="f" for="mt-a">ÁGUA (COPOS/DIA)<input type="number" id="mt-a" min="4" max="14" value="${mt.agua||8}"></label>
    <label class="f" for="mt-c">CARDIO (MIN/DIA)<input type="number" id="mt-c" min="5" max="90" value="${mt.cardio||20}"></label>
    <label class="f" for="mt-s">CARDIOS NA SEMANA<input type="number" id="mt-s" min="1" max="7" value="${mt.cardioSemana||3}"></label>
    <label class="f" for="mt-p">META DE PESO (KG)<input type="number" id="mt-p" step="0.1" value="${esc(a.meta||"")}"></label></div>
    <p class="note" style="margin-top:10px">Orientação alimentar geral. Plano alimentar individual é atribuição do nutricionista.</p>
    <button class="btn pink big full" data-x="psub" data-s="enviar">Próximo: enviar ›</button>`;
  return h;
}
function pmCollect(a){if(!a||!a.dieta)return;const g=id=>$("#"+id);
  a.dieta=a.dieta.map((m,i)=>g("pm-h-"+i)?{...m,hora:g("pm-h-"+i).value||m.hora,nome:g("pm-n-"+i).value.trim()||m.nome,itens:g("pm-i-"+i).value.split("\n").map(x=>x.trim()).filter(Boolean),main:g("pm-m-"+i).checked}:m)}
function mtCollect(a){const g=id=>$("#"+id);if(!g("mt-a"))return;const cl=(v,lo,hi,d)=>{const n=num(v);return n==null?d:Math.max(lo,Math.min(hi,Math.round(n)))};
  a.metas={agua:cl(g("mt-a").value,4,14,8),cardio:cl(g("mt-c").value,5,90,20),cardioSemana:cl(g("mt-s").value,1,7,3)};a.meta=g("mt-p").value;
  const k=g("kc-in");if(k){const n=num(k.value);a.kcal=n&&n>=900&&n<=5000?Math.round(n):null}}

/* enviar plano */
let shareOut=null;
function planPayload(a,msg){
  const tr={}; Object.entries(a.plano.treinos||{}).forEach(([wd,t])=>{if(t&&t.ex&&t.ex.length)tr[wd]=[t.nome,t.ex.map(it=>[it.e,+it.s||3,it.r||"12",+it.d||0,it.c||"",it.o||"",ytId(it.v)||ytId((PRO.videos||{})[it.e])||""])]});
  const c=calcKcal(a), mt=a.metas||{};
  return {t:"p",v:1,id:a.id,n:a.nome,pf:[PRO.perfil.nome,PRO.perfil.whats||"",PRO.perfil.cref||""],m:msg,ts:Date.now(),tr,
    di:a.dieta&&a.dieta.length?a.dieta.map(m=>[m.hora,m.nome,m.main?1:0,m.itens]):null,
    mt:{a:mt.agua||8,cm:mt.cardio||20,cs:mt.cardioSemana||3,pm:num(a.meta)||null,k:c?c.meta:null,mp:c?c.pg:null,mc:c?c.cg:null,mg:c?c.gg:null},
    al:{o:a.objetivo,p:num(a.peso),a:num(a.altura),i:num(a.idade),ac:a.acordar,th:a.treinoHora,nv:a.nivel}};
}
function alEnviar(a){
  const nT=Object.keys(a.plano.treinos).length, nE=Object.values(a.plano.treinos).reduce((s,t)=>s+t.ex.length,0), nD=(a.dieta||[]).length, c=calcKcal(a);
  const n=(a.nome||"").split(" ")[0];
  let h=`<div class="sec"><h2>O que vai no plano</h2></div><div class="card stack chk-list">
    <div class="${nT?"ok":""}"><i>${nT?"✓":"!"}</i><span><b>Treino</b>${nT?`${nT} dias, ${nE} exercícios com vídeo`:"ainda não montado"}</span>${nT?"":`<button class="mini" data-x="psub" data-s="treino">montar</button>`}</div>
    <div class="${nD?"ok":""}"><i>${nD?"✓":"–"}</i><span><b>Dieta</b>${nD?`${nD} refeições${c?` · ${c.meta} kcal`:""}`:"opcional · o aluno usa um modelo"}</span>${nD?"":`<button class="mini" data-x="psub" data-s="dieta">montar</button>`}</div>
    <div class="ok"><i>✓</i><span><b>Metas</b>${(a.metas||{}).agua||8} copos de água, cardio ${(a.metas||{}).cardio||20} min</span></div></div>
    <label class="f" for="sh-msg" style="margin-top:12px">MENSAGEM PARA O ALUNO<textarea id="sh-msg" rows="3">${esc(a.msg||`${n}, montei seu plano! Segue o treino com vídeo de cada exercício e a dieta. Qualquer dúvida me chama. Bora! 💪`)}</textarea></label>
    <button class="btn pink big full" style="margin-top:10px" data-x="sh-make" ${nT||nD?"":"disabled"}>${a.enviado?"Gerar link atualizado":"Gerar link do plano"}</button>
    <div id="sh-out"></div>`;
  if(a.enviado)h+=`<p class="note">Último envio: ${fmtDay(keyOf(new Date(a.enviado)))}${a.mudou&&a.mudou>a.enviado?" · você mudou o plano depois disso, envie de novo":""}</p>`;
  return h;
}
async function makeShare(a){
  const msg=($("#sh-msg")||{}).value||""; a.msg=msg; proSave();
  const code=await packCode(planPayload(a,msg)), url=SITE+"#p="+code;
  shareOut={id:a.id,url,code};
  let qr="";
  try{if(window.FFQR&&url.length<2300){const q=window.FFQR(0,"L");q.addData(url);q.make();qr=q.createSvgTag({cellSize:3,margin:2,scalable:true})}}catch(e){qr=""}
  const el=$("#sh-out"); if(!el)return;
  el.innerHTML=`<div class="card stack shout">${qr?`<div class="qr">${qr}</div><div class="tip" style="text-align:center">O aluno aponta a câmera do celular para abrir o plano</div>`:""}
    ${a.whats?`<button class="btn green big full" data-x="sh-wa">Enviar no WhatsApp de ${esc((a.nome||"").split(" ")[0])}</button>`:`<div class="tip">Cadastre o WhatsApp do aluno para enviar direto.</div>`}
    <button class="btn full" data-x="sh-copy">Copiar link</button></div>`;
}
function markSent(a){a.enviado=Date.now();a.mudou=null;proSave()}

/* relatório recebido */
function importReport(o){
  if(!PRO){toast("Crie sua área de professor primeiro");return}
  const a=PRO.alunos.find(x=>x.id===o.id);
  if(!a){incoming=o;openSheet(`<h2>Relatório de ${esc(o.n||"aluno")}</h2><div class="sub">Não achei esse aluno aqui. De quem é?</div>
    <div class="stack">${PRO.alunos.map(x=>`<button class="btn full" data-x="rep-to" data-id="${x.id}">${esc(x.nome)}</button>`).join("")}</div>
    <button class="btn pink full" data-x="rep-new">Criar aluno “${esc(o.n||"Aluno")}”</button><button class="btn ghost full" data-close="1">Cancelar</button>`);return}
  saveReport(a,o);
}
function saveReport(a,o){
  a.rel=[o].concat((a.rel||[]).filter(x=>x.ts!==o.ts)).sort((x,y)=>y.ts-x.ts).slice(0,12);
  if(o.w&&o.w.length)a.peso=String(o.w[o.w.length-1][1]);
  proSave(); closeSheet(); pv.aluno=a.id; pv.sub="resumo"; pv.tab="alunos"; incoming=null;
  try{history.replaceState(null,"",location.pathname)}catch(e){}
  render(); window.scrollTo(0,0); toast("Relatório de "+(a.nome||"aluno").split(" ")[0]+" recebido"); ding("big");
}

document.addEventListener("change",e=>{
  const a=curAluno(); if(!a||MODE!=="pro")return; const id=e.target.id||"";
  if(/^pm-/.test(id)){pmCollect(a);proSave()}
  if(/^(mt-|kc-in)/.test(id)){mtCollect(a);proSave();if(id==="kc-in")render()}
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-x]"); if(!b)return;
  const X=b.dataset, a=curAluno();
  switch(X.x){
    case "role-aluno":setMode("aluno");render();break;
    case "role-pro":setMode("pro");render();break;
    case "pro-create":{const n=($("#pf-n").value||"").trim();if(!n){toast("Escreva seu nome");break}
      PRO={perfil:{nome:n,whats:$("#pf-w").value.trim(),cref:$("#pf-c").value.trim()},alunos:[],videos:{},modelos:[],criado:Date.now()};proSave();setMode("pro");pv={tab:"alunos",aluno:null,sub:"resumo"};render();confetti(120);ding("big");
      if(incoming&&incoming.t==="r")importReport(incoming);break}
    case "role-back":setMode("");obStep=0;render();window.scrollTo(0,0);break;
    case "pro-exit":setMode(!S.profile&&!PRO?"":"aluno");closeSheet();render();window.scrollTo(0,0);break;
    case "to-pro":setMode("pro");pv.aluno=null;render();window.scrollTo(0,0);break;
    case "ptab":pv.tab=X.t;pv.aluno=null;render();window.scrollTo(0,0);break;
    case "pf-save":PRO.perfil={nome:$("#pf-n").value.trim()||PRO.perfil.nome,whats:$("#pf-w").value.trim(),cref:$("#pf-c").value.trim()};proSave();render();toast("Salvo");break;
    case "pro-backup":openSheet(`<h2>Backup dos alunos</h2><div class="sub">Copie e guarde (mande para você no WhatsApp ou e-mail). Para restaurar, cole aqui.</div>
      <button class="btn pink full" data-x="pbk-copy">Copiar backup</button><label class="f" for="pbk-in">RESTAURAR<textarea id="pbk-in" rows="4"></textarea></label><button class="btn full" data-x="pbk-restore">Restaurar</button><button class="btn ghost full" data-close="1">Fechar</button>`);break;
    case "pbk-copy":copyText(JSON.stringify({focofitPro:1,pro:PRO}),"Backup copiado");break;
    case "pbk-restore":try{const o=JSON.parse($("#pbk-in").value);if(!o||!o.pro||!Array.isArray(o.pro.alunos))throw 0;PRO=o.pro;proSave();closeSheet();render();toast("Backup restaurado")}catch(err){toast("Esse texto não é um backup do professor")}break;
    case "pro-reset":openSheet(`<h2>Apagar área do professor?</h2><div class="sub">Apaga todos os alunos, planos e relatórios deste aparelho. Seu app de aluno continua.</div><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn" style="background:var(--red);border-color:var(--red)" data-x="pro-reset-yes">Apagar</button></div>`);break;
    case "pro-reset-yes":PRO=null;proSave();try{localStorage.removeItem(LSP)}catch(err){}setMode("aluno");closeSheet();render();break;
    case "rep-as-pro":{setMode("pro");closeSheet();render();if(PRO&&incoming)importReport(incoming);break}
    case "rep-paste":openSheet(`<h2>Receber relatório</h2><div class="sub">Cole o link que o aluno mandou no WhatsApp.</div><textarea id="code-in" rows="4" placeholder="https://nandatobias56.github.io/FOCO_FIT/#r=..."></textarea><button class="btn pink big full" data-x="code-go">Abrir relatório</button><button class="btn ghost full" data-close="1">Fechar</button>`);break;
    case "rep-to":{const x=PRO.alunos.find(y=>y.id===X.id);if(x&&incoming)saveReport(x,incoming);break}
    case "rep-new":{if(!incoming)break;const x=blankAluno();x.id=incoming.id||x.id;x.nome=incoming.n||"Aluno";x.enviado=incoming.ts;PRO.alunos.push(x);saveReport(x,incoming);break}
    case "al-new":openAlunoForm(blankAluno(),true);break;
    case "af":alCollect(alDraft);alDraft[X.k]=X.v;refreshAlForm();break;
    case "af-dia":{alCollect(alDraft);const d=+X.d;alDraft.dias=alDraft.dias.includes(d)?alDraft.dias.filter(x=>x!==d):alDraft.dias.concat(d);refreshAlForm();break}
    case "al-save":{alCollect(alDraft);if(!alDraft.nome){toast("Escreva o nome do aluno");break}const isNew=alDraft._new;delete alDraft._new;
      if(isNew){PRO.alunos.push(alDraft);pv.aluno=alDraft.id;pv.sub="treino"}else{const i=PRO.alunos.findIndex(x=>x.id===alDraft.id);if(i>=0)PRO.alunos[i]=alDraft}
      proSave();closeSheet();render();window.scrollTo(0,0);if(isNew)toast("Agora monte o treino de "+alDraft.nome.split(" ")[0]);break}
    case "al-del":openSheet(`<h2>Excluir ${esc(alDraft.nome)}?</h2><div class="sub">Apaga o plano e os relatórios desse aluno.</div><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn" style="background:var(--red);border-color:var(--red)" data-x="al-del-yes">Excluir</button></div>`);break;
    case "al-del-yes":PRO.alunos=PRO.alunos.filter(x=>x.id!==alDraft.id);pv.aluno=null;proSave();closeSheet();render();break;
    case "al-open":pv.aluno=X.id;pv.sub="resumo";render();window.scrollTo(0,0);break;
    case "al-close":if(a){pmCollect(a);mtCollect(a);proSave()}pv.aluno=null;render();window.scrollTo(0,0);break;
    case "al-edit":if(a)openAlunoForm(a,false);break;
    case "psub":if(a){pmCollect(a);mtCollect(a);proSave()}pv.sub=X.s;render();window.scrollTo(0,0);break;
    case "gen-foco":if(a){a.foco=X.v;proSave();render()}break;
    case "gen-week":{if(!a)break;if(!a.dias.length){toast("Escolha os dias de treino nos dados do aluno");openAlunoForm(a,false);break}
      a.plano.treinos=genWeek(a.dias,a.foco||"equilibrado",a.objetivo,a.nivel);a.mudou=Date.now();proSave();render();ding("small");toast("Treino montado. Toque num dia para ajustar.");break}
    case "al-day":{if(!a)break;const wd=+X.wd,t=a.plano.treinos[wd];openEditor({who:"aluno",wd,nome:t?t.nome:"",list:t?t.ex:[]});break}
    case "mod-save":{if(!a)break;openSheet(`<h2>Salvar como modelo</h2><label class="f" for="mod-n">NOME DO MODELO<input type="text" id="mod-n" maxlength="40" value="${esc(Object.values(a.plano.treinos).map(t=>t.nome).join(" / ").slice(0,40))}"></label><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn pink" data-x="mod-save-yes">Salvar</button></div>`);break}
    case "mod-save-yes":{if(!a)break;PRO.modelos=PRO.modelos||[];PRO.modelos.push({id:newId(),nome:($("#mod-n").value||"Modelo").trim(),treinos:JSON.parse(JSON.stringify(a.plano.treinos))});proSave();closeSheet();render();toast("Modelo salvo");break}
    case "mod-apply":openSheet(`<h2>Aplicar modelo</h2><div class="sub">Substitui o treino atual de ${esc(a?a.nome:"")}.</div><div class="stack">${(PRO.modelos||[]).map(m=>`<button class="btn full" data-x="mod-use" data-id="${m.id}">${esc(m.nome)}</button>`).join("")}</div><button class="btn ghost full" data-close="1">Cancelar</button>`);break;
    case "mod-use":{const m=(PRO.modelos||[]).find(x=>x.id===X.id);if(a&&m){a.plano.treinos=JSON.parse(JSON.stringify(m.treinos));a.dias=Object.keys(m.treinos).map(Number);a.mudou=Date.now();proSave();closeSheet();render();toast("Modelo aplicado")}break}
    case "mod-del":PRO.modelos=(PRO.modelos||[]).filter(x=>x.id!==X.id);proSave();render();break;
    case "myvid-save":{const v=($("#myvid")||{}).value||"";if(v&&!ytId(v)){toast("Esse link não parece do YouTube");break}PRO.videos=PRO.videos||{};if(v)PRO.videos[X.e]=v;else delete PRO.videos[X.e];proSave();toast(v?"Seu vídeo vai para os alunos":"Voltei ao vídeo padrão");openExView({e:X.e},"lib-back");break}
    case "pm-gen":if(a){a.dieta=genDieta(a);a.mudou=Date.now();proSave();render();toast("Cardápio montado. Ajuste à vontade.")}break;
    case "pm-paste":openSheet(`<h2>Colar dieta</h2><div class="sub">Cole a dieta do nutricionista. Uma refeição por linha com horário, e os itens embaixo.</div><textarea id="pm-txt" rows="9" placeholder="07:00 Café da manhã&#10;- 1 pão integral&#10;- 1 iogurte"></textarea><button class="btn pink big full" data-x="pm-parse">Ler dieta</button><button class="btn ghost full" data-close="1">Cancelar</button>`);break;
    case "pm-parse":{if(!a)break;const ms=parseDietText($("#pm-txt").value);if(!ms.length){toast("Não achei refeições. Use “07:00 Café da manhã” e os itens embaixo.");break}a.dieta=ms;a.mudou=Date.now();proSave();closeSheet();render();toast(ms.length+" refeições lidas");break}
    case "pm-add":{if(!a)break;pmCollect(a);a.dieta=a.dieta||[];const l=a.dieta[a.dieta.length-1];a.dieta.push({id:"x"+Date.now(),tipo:"lanche",hora:l?fmtHora(Math.min(23,horaNum(l.hora)+2)):"10:00",nome:"Lanche",itens:[],main:false});proSave();render();break}
    case "pm-del":if(a){pmCollect(a);a.dieta.splice(+X.i,1);a.mudou=Date.now();proSave();render()}break;
    case "sh-make":if(a)makeShare(a);break;
    case "sh-wa":if(a&&shareOut){markSent(a);openExt(waLink(a.whats,`${a.msg||""}\n\nAbra seu plano no Foco Fit:\n${shareOut.url}`))}break;
    case "sh-copy":if(a&&shareOut){markSent(a);copyText(`${a.msg||""}\n\nAbra seu plano no Foco Fit:\n${shareOut.url}`,"Link copiado. Cole no WhatsApp do aluno.")}break;
  }
});
