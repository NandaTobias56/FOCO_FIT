/* ---------- conta: login, papéis (aluno, personal, nutri, admin) e vínculo pelo código do aluno ---------- */
const CFG = window.FF_CFG||{};
const CLOUD = !!(CFG.url&&CFG.anon&&(window.FFSupa||window.FF_API_STUB));
let sb=null;
function sbc(){if(!sb)sb=window.FFSupa.createClient(CFG.url,CFG.anon,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:"focofit.auth"}});return sb}
const ok_ = async p=>{const r=await p;if(r.error)throw r.error;return r.data};
const VINC_SEL="id,tipo,status,criado_em,aluno_id,profissional_id,prof:profissionais!vinculos_profissional_id_fkey(conselho,registro,uf,status,perfil:profiles!profissionais_id_fkey(nome)),aluno:profiles!vinculos_aluno_id_fkey(nome,nascimento)";
/* toda conversa com o servidor passa por aqui (os testes trocam por um falso) */
const API = window.FF_API_STUB||{
  async sendCode(email,criar,meta){await ok_(sbc().auth.signInWithOtp({email,options:{shouldCreateUser:criar,data:meta}}))},
  async verify(email,token){return (await ok_(sbc().auth.verifyOtp({email,token,type:"email"}))).user},
  async sessao(){const {data}=await sbc().auth.getSession();const u=data&&data.session&&data.session.user;return u?{uid:u.id,email:u.email}:null},
  async sair(){await sbc().auth.signOut()},
  async eu(uid){const perfil=await ok_(sbc().from("profiles").select("*").eq("id",uid).single());
    const prof=perfil.papel==="personal"||perfil.papel==="nutri"?await ok_(sbc().from("profissionais").select("*").eq("id",uid).maybeSingle()):null;
    return {perfil,prof}},
  async salvarPerfil(uid,campos){await ok_(sbc().from("profiles").update(campos).eq("id",uid))},
  async vinculos(){return ok_(sbc().from("vinculos").select(VINC_SEL).in("status",["pendente","ativo"]).order("criado_em",{ascending:false}))},
  async responder(id,aceitar){await ok_(sbc().rpc("responder_vinculo",{vinculo:id,aceitar}))},
  async revogar(id){await ok_(sbc().rpc("revogar_vinculo",{vinculo:id}))},
  async trocarCodigo(){return ok_(sbc().rpc("trocar_codigo"))},
  async pedir(codigo){return ok_(sbc().rpc("solicitar_vinculo",{codigo}))},
  async restricoes(ids){return ids.length?ok_(sbc().from("restricoes").select("*").in("aluno_id",ids).order("atualizado_em",{ascending:false})):[]},
  async addRestricao(r){await ok_(sbc().from("restricoes").insert(r))},
  async delRestricao(id){await ok_(sbc().from("restricoes").delete().eq("id",id))},
  async auditoria(){const l=await ok_(sbc().from("auditoria").select("*").order("em",{ascending:false}).limit(40));
    const ids=[...new Set(l.map(x=>x.ator_id).filter(Boolean))];
    const ps=ids.length?await ok_(sbc().from("profiles").select("id,nome,papel").in("id",ids)):[];return {l,ps}},
  async enviarDoc(uid,blob,ext){const path=`${uid}/registro-${Date.now()}.${ext}`;await ok_(sbc().storage.from("documentos").upload(path,blob,{contentType:blob.type,upsert:false}));return path},
  async salvarProf(row,existe){await ok_(existe?sbc().from("profissionais").update(row).eq("id",row.id):sbc().from("profissionais").insert(row))},
  async fila(){return ok_(sbc().from("profissionais").select("*,perfil:profiles!profissionais_id_fkey(nome)").order("criado_em",{ascending:true}))},
  async revisar(id,status,motivo){await ok_(sbc().rpc("revisar_profissional",{prof:id,novo_status:status,motivo_txt:motivo||null}))},
  async docUrl(path){return (await ok_(sbc().storage.from("documentos").createSignedUrl(path,300))).signedUrl},
  async syncDias(uid,rows){await ok_(sbc().from("registros_dia").upsert(rows.map(([dia,dados])=>({aluno_id:uid,dia,dados,atualizado_em:new Date().toISOString()}))))},
  async excluir(uid){try{const l=await ok_(sbc().storage.from("documentos").list(uid));if(l.length)await sbc().storage.from("documentos").remove(l.map(f=>uid+"/"+f.name))}catch(e){}
    await ok_(sbc().rpc("excluir_minha_conta"));await sbc().auth.signOut()}
};

const LSME="focofit.me", LSRS="focofit.restr", LSSY="focofit.sync";
const lsGet=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let ME=CLOUD?lsGet(LSME,null):null;
const CT={open:false,step:"",email:"",papel:"aluno",nome:"",intent:"",busy:false,data:null,aceite:false,doc:null,adm:"pendente"};
const PAPEL={aluno:"Aluno(a)",personal:"Personal trainer",nutri:"Nutricionista",admin:"Administrador"};
const TIPO_R={alergia:"Alergia",intolerancia:"Intolerância",preferencia:"Não come"};
const UFS="AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const papelDe=()=>ME&&ME.perfil?ME.perfil.papel:"";
const proLiberado=()=>papelDe()==="personal"&&ME.prof&&ME.prof.status==="aprovado";
const regTxt=p=>p?(p.conselho==="CREF"?"CREF "+p.registro:p.registro):"";
const idade=n=>{if(!n)return "";const d=new Date(n),h=new Date();let a=h.getFullYear()-d.getFullYear();if(h<new Date(h.getFullYear(),d.getMonth(),d.getDate()))a--;return a+" anos"};
const quando=ts=>{const d=new Date(ts);return d.getDate()+" "+MES[d.getMonth()]+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
function setME(m){ME=m;lsSet(LSME,m)}
/* com a nuvem ligada, o app só abre depois do login e do aceite dos termos */
const precisaLogin=()=>CLOUD&&!(ME&&ME.perfil&&ME.perfil.aceite_termos_em);
/* depois de entrar: aluno segue para o app; profissional ainda sem aprovação e admin vão para a conta */
function aposEntrar(){if(MODE)return;const p=papelDe();
  if(p==="aluno")setMode("aluno");else if(proLiberado())setMode("pro");else CT.open=true}

function errMsg(e){
  const m=String(e&&(e.message||e.error_description||e.msg)||e||""), c=e&&e.code;
  if(/fetch|network|Load failed|NetworkError/i.test(m))return "Sem internet. Tente de novo.";
  if(/expired|invalid/i.test(m)&&/otp|token|code/i.test(m))return "Código errado ou vencido. Confira ou peça outro.";
  if(/Signups not allowed|user not found/i.test(m))return "Não achei conta com esse e-mail. Toque em Criar conta.";
  if(/security purposes|rate limit|after \d+ seconds/i.test(m))return "Espere um minuto antes de pedir outro código.";
  if(c==="23505"||/duplicate key/i.test(m))return /registro/.test(m)?"Esse registro já está cadastrado em outra conta. Fale com o suporte.":"Isso já está cadastrado.";
  if(/registro_formato/.test(m))return "Confira o número do registro.";
  if(/JWT|sem login|not authenticated/i.test(m))return "Sua sessão acabou. Entre de novo.";
  const pt={"código não encontrado":"Código não encontrado. Confira com o aluno (ex.: FF-1A2B3C4D).","cadastro profissional não aprovado":"Seu registro ainda está em análise.","limite de pedidos por dia":"Você chegou ao limite de 30 pedidos hoje. Tente amanhã.","cadastro bloqueado":"Seu cadastro está bloqueado. Fale com o suporte.","conselho não combina com o papel":"Personal usa CREF e nutricionista usa CRN."};
  for(const k in pt)if(m.includes(k))return pt[k];
  return "Algo deu errado: "+m.slice(0,120);
}
async function run(fn){if(CT.busy)return;CT.busy=true;document.querySelectorAll("#app button,#layer button").forEach(b=>b.disabled=true);
  try{await fn()}catch(e){toast(errMsg(e))}finally{CT.busy=false;document.querySelectorAll("#app button,#layer button").forEach(b=>b.disabled=false)}}

/* abre/fecha a área da conta */
function openConta(intent){if(!CLOUD)return;CT.open=true;CT.intent=intent||"";CT.data=null;if(!ME){CT.step=intent==="pro"?"criar":"";if(intent==="pro")CT.papel="personal"}
  closeSheet();render();window.scrollTo(0,0);if(ME)loadHub()}
function closeConta(){CT.open=false;CT.data=null;render();window.scrollTo(0,0)}
async function refreshME(){const s=await API.sessao();if(!s){setME(null);return null}const e=await API.eu(s.uid);setME({uid:s.uid,email:s.email,perfil:e.perfil,prof:e.prof});return ME}
async function loadHub(){
  try{await refreshME();if(!ME){CT.data=null;if(CT.open)render();return}
    const p=papelDe(), d={};
    if(p==="admin")d.fila=await API.fila();
    else{d.v=await API.vinculos();
      const ids=p==="aluno"?[ME.uid]:d.v.filter(v=>v.status==="ativo").map(v=>v.aluno_id);
      d.r=await API.restricoes(ids);
      if(p==="aluno")lsSet(LSRS,d.r.map(r=>({t:r.tipo,i:r.item,g:r.gravidade})))}
    CT.data=d;
  }catch(e){CT.data={erro:errMsg(e)}}
  if(CT.open)render();
}

/* ---------- telas ---------- */
function renderConta(){
  $("#tabbar").hidden=true;
  let h;
  if(!ME)h=loginHTML();
  else if(!ME.perfil.aceite_termos_em)h=aceiteHTML();
  else{const p=papelDe();
    h=`<header class="phead ct-h"><div class="pi ${p}">${esc((ME.perfil.nome||ME.email||"?")[0].toUpperCase())}</div><div><small>${esc(PAPEL[p]||"")}</small><b>${esc(ME.perfil.nome||ME.email)}</b></div><button class="btn sm ghost" data-x="ct-close" aria-label="Voltar ao app">✕</button></header>`;
    if(!CT.data)h+=`<div class="card ct-load">Carregando…</div>`;
    else if(CT.data.erro)h+=`<div class="card stack"><b>Não consegui carregar</b><div class="tip">${esc(CT.data.erro)}</div><button class="btn full" data-x="ct-reload">Tentar de novo</button></div>`;
    else h+=p==="aluno"?hubAluno():p==="admin"?hubAdmin():hubProf();
    h+=`<div class="sec"><h2>Conta</h2></div><div class="card stack"><div class="tip">Entrou como <b>${esc(ME.email||"")}</b></div>
      <button class="btn full" data-x="ct-termos">Termos e privacidade</button>
      <button class="btn full" data-x="ct-sair">Sair da conta</button>
      <button class="btn ghost full" data-x="ct-excluir" style="color:var(--red)">Excluir minha conta</button></div>
      <button class="btn ghost full" style="margin-top:12px" data-x="ct-close">Voltar ao app</button>`;}
  $("#app").innerHTML=`<div class="stack ct">${h}</div>`;
}
function loginHTML(){
  const voltar=!CT.step&&!CT.open?"":`<button class="btn ghost full" data-x="${CT.step?"ct-step":"ct-close"}" data-s="">Voltar</button>`;
  if(CT.step==="codigo")return `<h1 class="ct-t">Digite o <span>código</span></h1>
    <p class="tip">Mandamos um código para <b>${esc(CT.email)}</b>. Olhe também a caixa de spam.</p>
    <input type="text" id="ct-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="000000" class="ct-otp" aria-label="Código do e-mail">
    <button class="btn pink big full" data-x="ct-verify">Entrar</button>
    <button class="btn full" data-x="ct-resend">Mandar outro código</button>${voltar}`;
  if(CT.step==="entrar")return `<h1 class="ct-t">Entrar na <span>conta</span></h1>
    <label class="f" for="ct-email">SEU E-MAIL<input type="email" id="ct-email" autocomplete="email" inputmode="email" value="${esc(CT.email)}" placeholder="voce@email.com"></label>
    <button class="btn pink big full" data-x="ct-send" data-c="0">Receber código no e-mail</button>
    <p class="note" style="margin-top:0">Sem senha: a cada login mandamos um código novo para o seu e-mail.</p>${voltar}`;
  if(CT.step==="criar"){const r=(id,t,s)=>`<button class="ct-papel ${CT.papel===id?"on":""}" data-x="ct-papel" data-p="${id}" aria-pressed="${CT.papel===id}"><b>${t}</b><small>${s}</small></button>`;
    return `<h1 class="ct-t">Criar <span>conta</span></h1>
    <div class="sub">Você é:</div>
    <div class="ct-papeis">${r("aluno","Aluno(a)","Sigo meu plano de treino e dieta")}${r("personal","Personal trainer","Tenho CREF e acompanho alunos")}${r("nutri","Nutricionista","Tenho CRN e monto dietas")}</div>
    <label class="f" for="ct-nome">SEU NOME COMPLETO<input type="text" id="ct-nome" maxlength="80" autocomplete="name" value="${esc(CT.nome)}" placeholder="${CT.papel==="aluno"?"ex.: Maria Silva":"como está no registro do conselho"}"></label>
    <label class="f" for="ct-email">SEU E-MAIL<input type="email" id="ct-email" autocomplete="email" inputmode="email" value="${esc(CT.email)}" placeholder="voce@email.com"></label>
    ${aceiteBoxes()}
    <button class="btn pink big full" data-x="ct-send" data-c="1">Receber código no e-mail</button>${voltar}`}
  return `<h1 class="ct-t">Sua conta <span>Foco Fit</span></h1>
    <div class="card stack feats">
      <div><i>1</i><span><b>Seus dados seguros na nuvem</b>Troque de celular sem perder nada.</span></div>
      <div><i>2</i><span><b>Personal e nutri de verdade</b>Só profissionais com CREF ou CRN conferido se vinculam a você, e só se você aceitar.</span></div>
      <div><i>3</i><span><b>Você manda</b>Desfaça um vínculo quando quiser e veja quem mexeu nos seus dados.</span></div></div>
    <button class="btn pink big full" data-x="ct-step" data-s="criar">Criar conta</button>
    <button class="btn big full" data-x="ct-step" data-s="entrar">Já tenho conta</button>${voltar}`;
}
function aceiteBoxes(){const a=CT.papel==="aluno";
  return `<label class="ctchk"><input type="checkbox" id="ct-ok1"><span>Li e aceito os <a href="#" data-x="ct-termos">Termos de uso e a Política de privacidade</a>.</span></label>
    ${a?`<label class="ctchk"><input type="checkbox" id="ct-ok2"><span><b>Autorizo o uso dos meus dados de saúde</b> (peso, medidas, treinos, alimentação, alergias) para o app funcionar e para os profissionais que <b>eu</b> aceitar. Posso desfazer quando quiser.</span></label>`
      :`<label class="ctchk"><input type="checkbox" id="ct-ok2"><span>Declaro que o registro que vou informar é meu e está ativo. Informação falsa leva ao bloqueio da conta.</span></label>`}`}
function aceitou(){const a=$("#ct-ok1"),b=$("#ct-ok2");return !!(a&&a.checked&&b&&b.checked)}
function aceiteHTML(){CT.papel=papelDe()||"aluno";
  return `<h1 class="ct-t">Antes de <span>continuar</span></h1><p class="tip">Precisamos do seu aceite para guardar seus dados.</p>${aceiteBoxes()}
    <button class="btn pink big full" data-x="ct-aceite">Continuar</button><button class="btn ghost full" data-x="ct-sair">Sair</button>`}
function termosHTML(){return `<h2>Termos e privacidade</h2><div class="ct-termos">
  <p><b>Rascunho para revisão jurídica.</b></p>
  <p><b>O que guardamos:</b> nome, e-mail, data de nascimento, e os dados que você registra no app (refeições, água, treinos, cardio, peso, medidas, alergias e restrições). Dados de saúde são dados pessoais sensíveis pela LGPD (Lei 13.709/2018) e só são usados com o seu consentimento.</p>
  <p><b>Quem vê:</b> você. Um personal ou nutricionista só vê seus dados depois que <b>você aceita</b> o pedido de vínculo, e para de ver na hora em que você desfaz. Nossa equipe de administração confere registros profissionais, mas não tem acesso aos seus dados de saúde.</p>
  <p><b>Profissionais:</b> todo personal precisa de CREF e todo nutricionista de CRN, conferidos por nós antes de poder se vincular a alunos. Prescrever dieta é atribuição do nutricionista; treino é do profissional de educação física.</p>
  <p><b>Seus direitos:</b> ver, corrigir, levar e apagar seus dados. Em Conta &gt; Excluir minha conta, tudo é apagado de forma definitiva.</p>
  <p><b>Segurança:</b> conexão criptografada, regras de acesso no próprio banco de dados e registro de cada alteração feita nos seus dados.</p>
  <p>O Foco Fit não substitui consulta médica. Em caso de alergia grave, avise seus profissionais também pessoalmente.</p></div>
  <button class="btn full" data-close="1">Fechar</button>`}

/* aluno */
function hubAluno(){const d=CT.data, pend=d.v.filter(v=>v.status==="pendente"), at=d.v.filter(v=>v.status==="ativo"), sy=lsGet(LSSY,{});
  let h=`<div class="card stack ct-code"><small>MEU CÓDIGO</small><b id="ct-cod">${esc(ME.perfil.codigo_vinculo||"")}</b>
    <div class="tip">Passe este código para o seu personal ou nutricionista. Eles pedem o vínculo e você aceita aqui.</div>
    <div class="grid2"><button class="btn pink" data-x="ct-cod-wa">Mandar no WhatsApp</button><button class="btn" data-x="ct-cod-copy">Copiar</button></div>
    <button class="btn ghost sm" data-x="ct-cod-novo">Trocar código</button></div>`;
  if(pend.length)h+=`<div class="sec"><h2>Pedidos para você</h2><small>${pend.length}</small></div><div class="stack">`+pend.map(v=>{const p=v.prof||{};
    return `<div class="card stack ct-req"><div><b>${esc(p.perfil?p.perfil.nome:"Profissional")}</b> quer ser seu ${v.tipo==="nutri"?"nutricionista":"personal"}</div>
      <div class="ct-reg">${esc(regTxt(p))}${p.status==="aprovado"?` <span class="ct-ok">✓ registro conferido</span>`:""}</div>
      <div class="tip">Se aceitar, vai ver seus registros do dia, treinos, dieta, avaliações e alergias${v.tipo==="nutri"?", e poderá montar sua dieta":", e poderá montar seu treino"}.</div>
      <div class="grid2"><button class="btn green" data-x="ct-resp" data-id="${v.id}" data-a="1">Aceitar</button><button class="btn" data-x="ct-resp" data-id="${v.id}" data-a="0">Recusar</button></div></div>`}).join("")+`</div>`;
  h+=`<div class="sec"><h2>Meus profissionais</h2><small>${at.length}</small></div>`;
  h+=at.length?`<div class="stack">`+at.map(v=>{const p=v.prof||{};return `<div class="alcard"><div class="t"><b>${esc(p.perfil?p.perfil.nome:"")}</b><small>${v.tipo==="nutri"?"Nutricionista":"Personal"} · ${esc(regTxt(p))}</small></div><button class="btn sm" data-x="ct-revogar" data-id="${v.id}" data-n="${esc(p.perfil?p.perfil.nome:"")}">Desfazer</button></div>`}).join("")+`</div>`
    :`<div class="card tip">Ninguém vinculado ainda.</div>`;
  h+=`<div class="sec"><h2>Alergias e restrições</h2><button class="btn sm pink" data-x="ct-r-add">+ Adicionar</button></div>`+restrList(d.r,true);
  h+=`<div class="sec"><h2>Meus dados</h2></div><div class="card stack"><div class="tip">${sy.ts?"Último envio para a nuvem: "+quando(sy.ts):"Seus registros ainda não foram para a nuvem."}${(sy.p||[]).length?` · ${sy.p.length} dia(s) esperando internet`:""}</div>
    <button class="btn full" data-x="ct-sync-all">Enviar todo o meu histórico</button>
    <button class="btn full" data-x="ct-audit">Quem mexeu nos meus dados</button></div>`;
  return h;
}
function restrList(rs,podeApagar){
  if(!rs.length)return `<div class="card tip">${papelDe()==="aluno"?"Tem alergia ou intolerância a algum alimento? Adicione aqui: seus profissionais vão ver, e o app avisa quando você registrar esse alimento.":"Nenhuma restrição informada."}</div>`;
  return `<div class="stack">`+rs.map(r=>`<div class="ct-r ${r.gravidade||""}"><div class="t"><b>${esc(r.item)}</b><small>${TIPO_R[r.tipo]||r.tipo}${r.gravidade?" · "+r.gravidade:""}${r.obs?" · "+esc(r.obs):""}${r.autor_id&&ME&&r.autor_id!==ME.uid?" · anotado pelo nutri":""}</small></div>${podeApagar?`<button class="btn sm ghost" data-x="ct-r-del" data-id="${r.id}" aria-label="Apagar ${esc(r.item)}">✕</button>`:""}</div>`).join("")+`</div>`;
}
function openRestrForm(aluno){CT.rAluno=aluno||ME.uid;CT.rTipo="alergia";CT.rGrav="grave";refreshRestrForm()}
function refreshRestrForm(){const it=$("#rf-item")?$("#rf-item").value:"", ob=$("#rf-obs")?$("#rf-obs").value:"";
  const ch=(k,v,t,cur)=>`<button class="chip ${cur===v?"on":""}" data-x="rf" data-k="${k}" data-v="${v}" aria-pressed="${cur===v}">${t}</button>`;
  openSheet(`<h2>Alergia ou restrição</h2><div class="ct-chips">${ch("rTipo","alergia","Alergia",CT.rTipo)}${ch("rTipo","intolerancia","Intolerância",CT.rTipo)}${ch("rTipo","preferencia","Não como",CT.rTipo)}</div>
    <label class="f" for="rf-item">ALIMENTO<input type="text" id="rf-item" maxlength="80" list="rf-sug" value="${esc(it)}" placeholder="ex.: amendoim, leite, glúten"></label>
    <datalist id="rf-sug">${["Amendoim","Castanhas","Leite","Lactose","Ovo","Glúten","Trigo","Soja","Peixe","Camarão","Frutos do mar","Carne vermelha","Carne de porco"].map(x=>`<option value="${x}">`).join("")}</datalist>
    ${CT.rTipo!=="preferencia"?`<div class="sub">Gravidade</div><div class="ct-chips">${ch("rGrav","leve","Leve",CT.rGrav)}${ch("rGrav","moderada","Moderada",CT.rGrav)}${ch("rGrav","grave","Grave",CT.rGrav)}</div>`:""}
    <label class="f" for="rf-obs">OBSERVAÇÃO (OPCIONAL)<input type="text" id="rf-obs" maxlength="300" value="${esc(ob)}" placeholder="ex.: tenho reação até com traços"></label>
    <button class="btn pink big full" data-x="rf-save">Salvar</button><button class="btn ghost full" data-close="1">Cancelar</button>`);
}

/* personal e nutri */
function hubProf(){const p=ME.prof, papel=papelDe(), d=CT.data;
  if(!p||p.status==="recusado"||CT.editReg)return (p&&p.status==="recusado"&&!CT.editReg?`<div class="card stack ct-st r"><b>Registro não aprovado</b><div class="tip">${esc(p.motivo||"Confira os dados e envie de novo.")}</div></div>`:"")+regForm(p);
  if(p.status==="bloqueado")return `<div class="card stack ct-st r"><b>Cadastro bloqueado</b><div class="tip">${esc(p.motivo||"")} Fale com o suporte.</div></div>`;
  if(p.status==="pendente")return `<div class="card stack ct-st y"><b>Registro em análise</b><div class="ct-reg">${esc(regTxt(p))} · ${esc(p.uf)}</div>
    <div class="tip">Conferimos seu registro no conselho e o documento enviado. Quando aprovar, você já pode vincular alunos. Volte aqui para ver o status.</div>
    <div class="grid2"><button class="btn" data-x="ct-reload">Ver status</button><button class="btn" data-x="ct-reg-edit">Corrigir dados</button></div></div>`;
  const pend=d.v.filter(v=>v.status==="pendente"), at=d.v.filter(v=>v.status==="ativo");
  let h=`<div class="card stack ct-st g"><b>✓ ${esc(regTxt(p))}</b><div class="tip">Registro conferido. Seus alunos veem esse selo.</div></div>`;
  if(papel==="personal")h+=`<button class="btn cyan big full" data-x="ct-to-pro">Abrir minha área de treinos</button>`;
  h+=`<div class="sec"><h2>Vincular aluno</h2></div><div class="card stack"><div class="tip">Peça o código ao aluno. Ele aparece em Ajustes &gt; Minha conta no app dele.</div>
    <div style="display:flex;gap:8px"><input type="text" id="ct-pedir" maxlength="11" placeholder="FF-1A2B3C4D" autocapitalize="characters" aria-label="Código do aluno"><button class="btn pink" data-x="ct-pedir">Pedir</button></div></div>`;
  if(pend.length)h+=`<div class="sec"><h2>Esperando o aluno aceitar</h2><small>${pend.length}</small></div><div class="stack">`+pend.map(v=>`<div class="alcard"><div class="t"><b>${esc(v.aluno?v.aluno.nome:"Aluno")}</b><small>Pedido em ${quando(v.criado_em)}</small></div><button class="btn sm ghost" data-x="ct-revogar" data-id="${v.id}" data-n="${esc(v.aluno?v.aluno.nome:"")}">Cancelar</button></div>`).join("")+`</div>`;
  h+=`<div class="sec"><h2>Meus alunos</h2><small>${at.length}</small></div>`;
  h+=at.length?`<div class="stack">`+at.map(v=>{const rs=d.r.filter(r=>r.aluno_id===v.aluno_id), gr=rs.filter(r=>r.gravidade==="grave");
    return `<button class="alcard" data-x="ct-al" data-id="${v.id}"><div class="t"><b>${esc(v.aluno?v.aluno.nome:"")}</b><small>${[idade(v.aluno&&v.aluno.nascimento),rs.length?rs.length+(rs.length>1?" restrições":" restrição"):"sem restrições"].filter(Boolean).map(esc).join(" · ")}</small></div>${gr.length?`<span class="ct-alert" title="Alergia grave">⚠ ${esc(gr.map(r=>r.item).join(", "))}</span>`:""}</button>`}).join("")+`</div>`
    :`<div class="card tip">Quando um aluno aceitar o seu pedido, ele aparece aqui.</div>`;
  return h;
}
function regForm(p){const cref=papelDe()==="personal", f=CT.reg||(CT.reg=regDraft(p));
  const opt=(l,v)=>l.map(x=>`<option ${String(x)===String(v)?"selected":""}>${x}</option>`).join("");
  return `<div class="sec"><h2>Seu registro no ${cref?"CREF":"CRN"}</h2></div><div class="card stack">
    <div class="tip">Obrigatório. Conferimos no conselho antes de liberar o vínculo com alunos.</div>
    ${cref?`<div class="g3"><label class="f" for="rg-num">NÚMERO<input type="text" id="rg-num" inputmode="numeric" maxlength="6" value="${esc(f.num)}" placeholder="012345"></label>
      <label class="f" for="rg-cat">CATEGORIA<select id="rg-cat">${["G","P"].map(x=>`<option value="${x}" ${f.cat===x?"selected":""}>${x}</option>`).join("")}</select></label>
      <label class="f" for="rg-uf">ESTADO<select id="rg-uf">${opt(UFS,f.uf)}</select></label></div>`
    :`<div class="g3"><label class="f" for="rg-reg">REGIÃO<select id="rg-reg">${opt([1,2,3,4,5,6,7,8,9,10,11].map(n=>"CRN-"+n),f.reg)}</select></label>
      <label class="f" for="rg-num">NÚMERO<input type="text" id="rg-num" inputmode="numeric" maxlength="7" value="${esc(f.num)}" placeholder="12345"></label>
      <label class="f" for="rg-uf">ESTADO<select id="rg-uf">${opt(UFS,f.uf)}</select></label></div>`}
    <div class="ct-prev" id="rg-prev">Fica assim: <b>${esc(regMontar(f)||"—")}</b></div>
    <label class="f">FOTO DA CARTEIRA DO CONSELHO<span class="ct-file"><input type="file" id="rg-doc" accept="image/*,application/pdf"><span>${CT.doc?"✓ "+esc(CT.doc.name):(p&&p.documento_path?"✓ documento já enviado (toque para trocar)":"Toque para tirar foto ou escolher")}</span></span></label>
    <label class="ctchk"><input type="checkbox" id="ct-ok2"><span>Declaro que este registro é meu e está ativo. Informação falsa leva ao bloqueio da conta.</span></label>
    <button class="btn pink big full" data-x="ct-reg-save">Enviar para análise</button>
    ${CT.editReg?`<button class="btn ghost full" data-x="ct-reg-cancel">Cancelar</button>`:""}</div>`;
}
function regDraft(p){const r=p&&p.registro||"";let m;
  if((m=r.match(/^(\d{6})-([GP])\/([A-Z]{2})$/)))return {num:m[1],cat:m[2],uf:p.uf||m[3]};
  if((m=r.match(/^(CRN-\d{1,2}) ?(\d+)/)))return {reg:m[1],num:m[2],uf:p.uf||"SP"};
  return {num:"",cat:"G",uf:"SP",reg:"CRN-3"}}
function regCollect(){const f=CT.reg;["num","cat","uf","reg"].forEach(k=>{const el=$("#rg-"+k);if(el)f[k]=el.value.trim().toUpperCase()});f.num=f.num.replace(/\D/g,"")}
function regMontar(f){if(!f.num)return "";return papelDe()==="personal"?f.num.padStart(6,"0")+"-"+(f.cat||"G")+"/"+f.uf:(f.reg||"CRN-3")+" "+f.num}
/* foto grande vira JPEG de até 1600px (cabe no limite e sobe rápido) */
async function encolher(file){
  if(!/^image\//.test(file.type)||file.type==="image/gif")return {blob:file,ext:file.type==="application/pdf"?"pdf":(file.type.split("/")[1]||"jpg")};
  try{const url=URL.createObjectURL(file), img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=url});
    const k=Math.min(1,1600/Math.max(img.width,img.height)), c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
    const blob=await new Promise(ok=>c.toBlob(ok,"image/jpeg",.85));return {blob:blob||file,ext:"jpg"}}catch(e){return {blob:file,ext:"jpg"}}
}
function openAlunoConta(v){const rs=CT.data.r.filter(r=>r.aluno_id===v.aluno_id), nutri=papelDe()==="nutri";CT.alV=v;
  openSheet(`<h2>${esc(v.aluno?v.aluno.nome:"Aluno")}</h2><div class="sub">${[idade(v.aluno&&v.aluno.nascimento),"vinculado desde "+quando(v.criado_em)].filter(Boolean).map(esc).join(" · ")}</div>
    <div class="sec" style="margin-top:6px"><h2>Alergias e restrições</h2>${nutri?`<button class="btn sm pink" data-x="ct-r-add" data-a="${v.aluno_id}">+ Adicionar</button>`:""}</div>
    ${restrList(rs,nutri)}${nutri?"":`<div class="tip">Só o aluno e o nutricionista editam esta lista. Respeite estas restrições em qualquer orientação.</div>`}
    <div class="tip" style="margin-top:10px">Avaliação física, bioimpedância e acompanhamento chegam na próxima etapa.</div>
    <button class="btn ghost full" data-x="ct-revogar" data-id="${v.id}" data-n="${esc(v.aluno?v.aluno.nome:"")}" style="color:var(--red)">Desfazer vínculo</button>
    <button class="btn full" data-close="1">Fechar</button>`)}

/* administrador */
function hubAdmin(){const f=CT.data.fila, ver=CT.adm, l=f.filter(p=>ver==="pendente"?p.status==="pendente":p.status!=="pendente");
  let h=`<div class="card tip">Confira cada registro no site do conselho (CREF da região para personal, CRN da região para nutricionista): número ativo e nome igual ao da conta e do documento.</div>
    <div class="grid2" style="margin-top:12px"><button class="btn ${ver==="pendente"?"pink":""}" data-x="ad-ver" data-v="pendente">Para conferir (${f.filter(p=>p.status==="pendente").length})</button><button class="btn ${ver!=="pendente"?"pink":""}" data-x="ad-ver" data-v="feitos">Já revisados</button></div>`;
  if(!l.length)return h+`<div class="card tip" style="margin-top:12px">Nada por aqui.</div>`;
  return h+`<div class="stack" style="margin-top:12px">`+l.map(p=>`<div class="card stack ct-adm ${p.status}"><div><b>${esc(p.perfil?p.perfil.nome:"")}</b> <small class="ct-tag">${p.conselho==="CREF"?"Personal":"Nutri"}</small></div>
    <div class="ct-reg">${esc(regTxt(p))} · ${esc(p.uf)} · enviado ${quando(p.criado_em)}</div>
    ${p.status!=="pendente"?`<div class="tip">Status: <b>${esc(p.status)}</b>${p.motivo?" · "+esc(p.motivo):""}</div>`:""}
    <button class="btn full" data-x="ad-doc" data-p="${esc(p.documento_path||"")}" ${p.documento_path?"":"disabled"}>${p.documento_path?"Ver documento":"Sem documento"}</button>
    <div class="g3"><button class="btn green" data-x="ad-rev" data-id="${p.id}" data-s="aprovado">Aprovar</button><button class="btn" data-x="ad-rev" data-id="${p.id}" data-s="recusado">Recusar</button><button class="btn" data-x="ad-rev" data-id="${p.id}" data-s="bloqueado">Bloquear</button></div></div>`).join("")+`</div>`;
}

/* ---------- registros do dia vão para a nuvem (só aluno logado) ---------- */
let syT=null;
function cloudDay(k){if(!CLOUD||papelDe()!=="aluno")return;const sy=lsGet(LSSY,{});sy.p=[...new Set([...(sy.p||[]),k])];lsSet(LSSY,sy);clearTimeout(syT);syT=setTimeout(flushCloud,3000)}
async function flushCloud(){const sy=lsGet(LSSY,{}), ks=(sy.p||[]).slice(0,200);if(!ks.length||!ME)return;
  try{await API.syncDias(ME.uid,ks.map(k=>[k,S.days[k]||{}]));const n=lsGet(LSSY,{});n.p=(n.p||[]).filter(k=>!ks.includes(k));n.ts=Date.now();lsSet(LSSY,n);if(n.p.length)syT=setTimeout(flushCloud,500)}catch(e){}}
/* alimento registrado que bate com alergia do aluno */
function alergiaEm(txt){const t=" "+norm(txt)+" ";return lsGet(LSRS,[]).filter(r=>{const i=norm(r.i).trim();return i.length>=3&&t.includes(i.replace(/s$/,""))})}

/* ---------- ações ---------- */
document.addEventListener("click",e=>{
  if(!CLOUD)return;const b=e.target.closest("[data-x]");if(!b)return;
  /* área do professor exige conta de personal com CREF aprovado */
  if((b.dataset.x==="role-pro"||b.dataset.x==="to-pro")&&!proLiberado()){e.stopImmediatePropagation();e.preventDefault();openConta("pro")}
},true);
document.addEventListener("click",e=>{
  if(!CLOUD)return;const b=e.target.closest("[data-x]");if(!b)return;const X=b.dataset;
  switch(X.x){
    case "ct-open":openConta();break;
    case "ct-close":closeConta();break;
    case "ct-step":CT.step=X.s;render();window.scrollTo(0,0);break;
    case "ct-papel":CT.nome=$("#ct-nome").value;CT.email=$("#ct-email").value;CT.papel=X.p;render();break;
    case "ct-termos":e.preventDefault();openSheet(termosHTML());break;
    case "ct-send":run(async()=>{const em=($("#ct-email").value||"").trim().toLowerCase(), criar=X.c==="1";
      if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)){toast("Confira o e-mail");return}
      let meta;if(criar){const n=($("#ct-nome").value||"").trim();if(n.length<3){toast("Escreva seu nome completo");return}
        if(!aceitou()){toast("Marque as duas caixinhas para continuar");return}CT.nome=n;CT.aceite=true;meta={papel:CT.papel,nome:n}}
      await API.sendCode(em,criar,meta);CT.email=em;CT.step="codigo";render();toast("Código enviado para "+em)});break;
    case "ct-resend":run(async()=>{await API.sendCode(CT.email,!!CT.aceite,CT.aceite?{papel:CT.papel,nome:CT.nome}:undefined);toast("Mandei outro código")});break;
    case "ct-verify":run(async()=>{const c=($("#ct-otp").value||"").replace(/\D/g,"");if(c.length<6){toast("O código tem 6 números ou mais");return}
      await API.verify(CT.email,c);await refreshME();
      if(ME&&CT.aceite&&!ME.perfil.aceite_termos_em){await API.salvarPerfil(ME.uid,{aceite_termos_em:new Date().toISOString()});ME.perfil.aceite_termos_em=new Date().toISOString();setME(ME)}
      CT.step="";CT.aceite=false;if(ME&&ME.perfil.aceite_termos_em)aposEntrar();render();window.scrollTo(0,0);confetti(80);ding("small");loadHub();
      if(papelDe()==="aluno")setTimeout(()=>{if(Object.keys(S.days).length&&!(lsGet(LSSY,{}).ts))syncTudo(true)},1500)});break;
    case "ct-aceite":run(async()=>{if(!aceitou()){toast("Marque as duas caixinhas para continuar");return}const t=new Date().toISOString();await API.salvarPerfil(ME.uid,{aceite_termos_em:t});ME.perfil.aceite_termos_em=t;setME(ME);aposEntrar();render();loadHub()});break;
    case "ct-reload":CT.data=null;render();loadHub();break;
    case "ct-sair":run(async()=>{try{await API.sair()}catch(err){}setME(null);lsSet(LSRS,null);CT.data=null;CT.step="";CT.reg=null;CT.doc=null;setMode("");render();toast("Você saiu da conta")});break;
    case "ct-excluir":openSheet(`<h2>Excluir sua conta?</h2><div class="sub">Apaga para sempre sua conta e tudo o que está na nuvem${papelDe()==="aluno"?" (registros, alergias, planos e avaliações)":""}, e desfaz todos os vínculos. O que está guardado neste celular continua aqui.</div>
      <label class="f" for="ex-conf">PARA CONFIRMAR, ESCREVA EXCLUIR<input type="text" id="ex-conf" autocapitalize="characters"></label>
      <div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn" style="background:var(--red);border-color:var(--red)" data-x="ct-excluir-sim">Excluir para sempre</button></div>`);break;
    case "ct-excluir-sim":run(async()=>{if(($("#ex-conf").value||"").trim().toUpperCase()!=="EXCLUIR"){toast("Escreva EXCLUIR para confirmar");return}
      await API.excluir(ME.uid);setME(null);lsSet(LSRS,null);lsSet(LSSY,null);setMode("");closeSheet();CT.data=null;CT.step="";render();toast("Conta excluída")});break;
    /* aluno */
    case "ct-cod-copy":copyText(ME.perfil.codigo_vinculo,"Código copiado");break;
    case "ct-cod-wa":openExt("https://wa.me/?text="+encodeURIComponent(`Meu código no Foco Fit é ${ME.perfil.codigo_vinculo}. No app, entre na sua conta de profissional e use em "Vincular aluno".`));break;
    case "ct-cod-novo":openSheet(`<h2>Trocar seu código?</h2><div class="sub">O código atual para de funcionar. Quem já está vinculado continua. Faça isso se passou o código para alguém por engano.</div><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn pink" data-x="ct-cod-novo-sim">Trocar</button></div>`);break;
    case "ct-cod-novo-sim":run(async()=>{const c=await API.trocarCodigo();ME.perfil.codigo_vinculo=c;setME(ME);closeSheet();render();toast("Novo código: "+c)});break;
    case "ct-resp":run(async()=>{await API.responder(X.id,X.a==="1");toast(X.a==="1"?"Vínculo aceito":"Pedido recusado");if(X.a==="1")ding("small");await loadHub()});break;
    case "ct-revogar":openSheet(`<h2>Desfazer vínculo${X.n?" com "+esc(X.n):""}?</h2><div class="sub">${papelDe()==="aluno"?"Na mesma hora a pessoa para de ver seus dados.":"Você para de ver os dados desse aluno."}</div><div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn" style="background:var(--red);border-color:var(--red)" data-x="ct-revogar-sim" data-id="${esc(X.id)}">Desfazer</button></div>`);break;
    case "ct-revogar-sim":run(async()=>{await API.revogar(X.id);closeSheet();toast("Vínculo desfeito");await loadHub()});break;
    case "ct-r-add":openRestrForm(X.a);break;
    case "rf":CT[X.k]=X.v;refreshRestrForm();break;
    case "rf-save":run(async()=>{const it=($("#rf-item").value||"").trim();if(!it){toast("Escreva o alimento");return}
      await API.addRestricao({aluno_id:CT.rAluno,tipo:CT.rTipo,item:it,gravidade:CT.rTipo==="preferencia"?null:CT.rGrav,obs:($("#rf-obs").value||"").trim()||null,autor_id:ME.uid});
      closeSheet();toast("Salvo");await loadHub();if(CT.alV&&papelDe()!=="aluno")openAlunoConta(CT.alV)});break;
    case "ct-r-del":run(async()=>{await API.delRestricao(X.id);closeSheet();await loadHub();if(CT.alV&&papelDe()!=="aluno")openAlunoConta(CT.alV)});break;
    case "ct-sync-all":syncTudo(false);break;
    case "ct-audit":run(async()=>{const {l,ps}=await API.auditoria(), nm=id=>id===ME.uid?"Você":((ps.find(p=>p.id===id)||{}).nome||"Sistema");
      const T={restricoes:"alergias",planos_treino:"plano de treino",planos_dieta:"dieta",avaliacoes:"avaliação",vinculos:"vínculo"}, A={INSERT:"criou",UPDATE:"alterou",DELETE:"apagou"};
      openSheet(`<h2>Quem mexeu nos seus dados</h2><div class="stack ct-audit">${l.length?l.map(x=>`<div><b>${esc(nm(x.ator_id))}</b> ${A[x.acao]||x.acao} ${T[x.tabela]||x.tabela}<small>${quando(x.em)}</small></div>`).join(""):`<div class="tip">Nada ainda.</div>`}</div><button class="btn full" data-close="1">Fechar</button>`)});break;
    /* profissional */
    case "ct-to-pro":CT.open=false;setMode("pro");pv.aluno=null;if(!PRO){PRO={perfil:{nome:ME.perfil.nome,whats:"",cref:ME.prof.registro},alunos:[],videos:{},modelos:[],criado:Date.now()};proSave()}render();window.scrollTo(0,0);break;
    case "ct-reg-edit":CT.editReg=true;CT.reg=null;render();break;
    case "ct-reg-cancel":CT.editReg=false;CT.reg=null;CT.doc=null;render();break;
    case "ct-reg-save":run(async()=>{regCollect();const f=CT.reg, reg=regMontar(f), cref=papelDe()==="personal";
      if(cref?!/^\d{1,6}$/.test(f.num):!/^\d{3,7}$/.test(f.num)){toast("Confira o número do registro");return}
      if(!CT.doc&&!(ME.prof&&ME.prof.documento_path)){toast("Mande a foto da carteira do conselho");return}
      const dc=$("#ct-ok2");if(!dc||!dc.checked){toast("Marque a declaração para continuar");return}
      let path=ME.prof&&ME.prof.documento_path;
      if(CT.doc){const {blob,ext}=await encolher(CT.doc);if(blob.size>5242880){toast("Arquivo grande demais (máximo 5 MB)");return}path=await API.enviarDoc(ME.uid,blob,ext)}
      await API.salvarProf({id:ME.uid,conselho:cref?"CREF":"CRN",registro:reg,uf:f.uf,documento_path:path},!!ME.prof);
      CT.editReg=false;CT.reg=null;CT.doc=null;toast("Enviado para análise");await loadHub()});break;
    case "ct-pedir":run(async()=>{let c=($("#ct-pedir").value||"").trim().toUpperCase().replace(/\s/g,"");if(/^[0-9A-F]{8}$/.test(c))c="FF-"+c;
      if(!/^FF-[0-9A-F]{8}$/.test(c)){toast("O código tem o formato FF-1A2B3C4D");return}
      const r=await API.pedir(c);toast(r==="já existe"?"Você já pediu ou já está vinculado a esse aluno":"Pedido enviado. Agora o aluno aceita no app dele.");await loadHub()});break;
    case "ct-al":{const v=CT.data&&CT.data.v.find(x=>x.id===X.id);if(v)openAlunoConta(v);break}
    /* administrador */
    case "ad-ver":CT.adm=X.v;render();break;
    case "ad-doc":run(async()=>{openExt(await API.docUrl(X.p))});break;
    case "ad-rev":if(X.s==="aprovado")run(async()=>{await API.revisar(X.id,"aprovado");toast("Aprovado");await loadHub()});
      else openSheet(`<h2>${X.s==="recusado"?"Recusar":"Bloquear"} cadastro</h2><div class="sub">O profissional vai ver este motivo.</div>
        <label class="f" for="ad-mot">MOTIVO<input type="text" id="ad-mot" maxlength="200" placeholder="${X.s==="recusado"?"ex.: número não encontrado no CREF-4":"ex.: registro cancelado no conselho"}"></label>
        <div class="row-end"><button class="btn ghost" data-close="1">Cancelar</button><button class="btn pink" data-x="ad-rev-sim" data-id="${esc(X.id)}" data-s="${esc(X.s)}">Confirmar</button></div>`);break;
    case "ad-rev-sim":run(async()=>{const m=($("#ad-mot").value||"").trim();if(m.length<5){toast("Escreva o motivo");return}await API.revisar(X.id,X.s,m);closeSheet();toast("Feito");await loadHub()});break;
  }
});
document.addEventListener("change",e=>{
  if(!CT.open)return;const id=e.target.id||"";
  if(id==="rg-doc"){CT.doc=e.target.files&&e.target.files[0]||null;regCollect();render()}
  else if(/^rg-/.test(id)){regCollect();const p=$("#rg-prev");if(p)p.innerHTML="Fica assim: <b>"+esc(regMontar(CT.reg)||"—")+"</b>"}
});
document.addEventListener("input",e=>{if(CT.open&&e.target.id==="rg-num"){regCollect();const p=$("#rg-prev");if(p)p.innerHTML="Fica assim: <b>"+esc(regMontar(CT.reg)||"—")+"</b>"}});
async function syncTudo(silencioso){const ks=Object.keys(S.days).sort();if(!ks.length){if(!silencioso)toast("Ainda não há registros");return}
  const sy=lsGet(LSSY,{});sy.p=[...new Set([...(sy.p||[]),...ks])];lsSet(LSSY,sy);
  await run(async()=>{while((lsGet(LSSY,{}).p||[]).length){const before=lsGet(LSSY,{}).p.length;await flushCloud();if(lsGet(LSSY,{}).p.length>=before)throw new Error("network")}
    if(!silencioso)toast(ks.length+" dia(s) enviados para a nuvem");if(CT.open)render()})}

/* início: confere a sessão e não deixa a área do professor aberta sem CREF aprovado */
if(CLOUD){
  if(MODE==="pro"&&!proLiberado())setMode("");
  refreshME().then(()=>{if(MODE==="pro"&&!proLiberado()){setMode("");render()}if(CT.open)render();if(papelDe()==="aluno"){flushCloud();API.restricoes([ME.uid]).then(r=>lsSet(LSRS,r.map(x=>({t:x.tipo,i:x.item,g:x.gravidade})))).catch(()=>{})}}).catch(()=>{});
}
