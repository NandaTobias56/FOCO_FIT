// Servidor falso em memória, com as mesmas regras do banco, guardado no localStorage para sobreviver a recarregar
(function(){
const K="stub.db";
const db=JSON.parse(localStorage.getItem(K)||"null")||{users:{},profiles:{},prof:{},vinc:[],restr:[],dias:{},audit:[],docs:{},sess:null,otp:{}};
const save=()=>localStorage.setItem(K,JSON.stringify(db));
const uid=()=>"u"+Math.random().toString(36).slice(2,10);
const code=()=>"FF-"+Math.random().toString(16).slice(2,10).toUpperCase().padEnd(8,"0");
const me=()=>{if(!db.sess)throw {message:"JWT expired"};return db.sess.uid};
const sleep=()=>new Promise(r=>setTimeout(r,120));
const profView=id=>{const p=db.prof[id];return p?{...p,perfil:{nome:db.profiles[id].nome}}:null};
window.FF_STUB_DB=db; window.FF_STUB_SAVE=save;
window.FF_API_STUB={
  async sendCode(email,criar,meta){await sleep();let u=Object.values(db.users).find(x=>x.email===email);
    if(!u){if(!criar)throw {message:"Signups not allowed for otp"};u={id:uid(),email,meta};db.users[u.id]=u;
      const pp=["aluno","personal","nutri"].includes(meta.papel)?meta.papel:"aluno";db.profiles[u.id]={id:u.id,papel:pp,nome:meta.nome,codigo_vinculo:pp==="aluno"?code():null,aceite_termos_em:null,nascimento:null}}
    db.otp[email]="123456";save()},
  async verify(email,token){await sleep();if(db.otp[email]!==token)throw {message:"Token has expired or is invalid"};const u=Object.values(db.users).find(x=>x.email===email);db.sess={uid:u.id,email};save();return u},
  async sessao(){return db.sess},
  async sair(){db.sess=null;save()},
  async eu(id){await sleep();return {perfil:{...db.profiles[id]},prof:db.prof[id]?{...db.prof[id]}:null}},
  async salvarPerfil(id,c){Object.assign(db.profiles[id],c);save()},
  async vinculos(){const m=me();await sleep();return db.vinc.filter(v=>(v.aluno_id===m||v.profissional_id===m)&&["pendente","ativo"].includes(v.status)).map(v=>({...v,prof:profView(v.profissional_id),aluno:{nome:db.profiles[v.aluno_id].nome,nascimento:db.profiles[v.aluno_id].nascimento}}))},
  async responder(id,a){const v=db.vinc.find(x=>x.id===id&&x.aluno_id===me()&&x.status==="pendente");if(!v)throw {message:"pedido não encontrado"};v.status=a?"ativo":"recusado";save()},
  async revogar(id){const m=me(),v=db.vinc.find(x=>x.id===id&&(x.aluno_id===m||x.profissional_id===m));v.status="revogado";save()},
  async trocarCodigo(){const c=code();db.profiles[me()].codigo_vinculo=c;save();return c},
  async pedir(c){const m=me(),p=db.prof[m];if(!p||p.status!=="aprovado")throw {message:"cadastro profissional não aprovado"};
    const a=Object.values(db.profiles).find(x=>x.codigo_vinculo===c);if(!a)throw {message:"código não encontrado"};
    if(db.vinc.find(v=>v.aluno_id===a.id&&v.profissional_id===m&&["pendente","ativo"].includes(v.status)))return "já existe";
    db.vinc.push({id:uid(),aluno_id:a.id,profissional_id:m,tipo:p.conselho==="CREF"?"personal":"nutri",status:"pendente",criado_em:new Date().toISOString()});save();return "pedido enviado"},
  async restricoes(ids){return db.restr.filter(r=>ids.includes(r.aluno_id))},
  async addRestricao(r){db.restr.unshift({...r,id:uid(),atualizado_em:new Date().toISOString()});db.audit.unshift({ator_id:me(),aluno_id:r.aluno_id,tabela:"restricoes",acao:"INSERT",em:new Date().toISOString()});save()},
  async delRestricao(id){db.restr=db.restr.filter(r=>r.id!==id);save()},
  async auditoria(){const m=me();const l=db.audit.filter(a=>a.aluno_id===m);return {l,ps:Object.values(db.profiles).map(p=>({id:p.id,nome:p.nome,papel:p.papel}))}},
  async enviarDoc(id,blob,ext){const path=id+"/registro-"+Date.now()+"."+ext;db.docs[path]=blob.size;save();return path},
  async salvarProf(row){const m=me();const pp=db.profiles[m].papel;if((pp==="personal")!==(row.conselho==="CREF"))throw {message:"conselho não combina com o papel"};
    db.prof[m]={...row,status:"pendente",motivo:null,criado_em:new Date().toISOString()};save()},
  async fila(){return Object.keys(db.prof).map(profView)},
  async revisar(id,s,m){Object.assign(db.prof[id],{status:s,motivo:m||null});save()},
  async docUrl(p){return "about:blank"},
  async syncDias(id,rows){rows.forEach(([d,x])=>db.dias[id+":"+d]=x);save()},
  async excluir(id){delete db.profiles[id];delete db.users[id];delete db.prof[id];db.vinc=db.vinc.filter(v=>v.aluno_id!==id&&v.profissional_id!==id);db.sess=null;save()}
};
})();
