// Teste das telas de conta com servidor falso. Gere um build com SUPABASE_URL/SUPABASE_ANON_KEY de teste, sirva www/ em localhost:8765 e rode: node tests/ui/conta.test.cjs
const {chromium}=require('playwright');const fs=require('fs');
const SC=__dirname, OUT=SC+'/shots/'; fs.mkdirSync(OUT,{recursive:true});
(async()=>{
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.addInitScript({path:SC+'/servidor-falso.js'});
await pg.goto('http://localhost:8765/');await pg.waitForTimeout(500);
const shot=n=>pg.screenshot({path:OUT+n+'.png',fullPage:true});
const toast=async()=>{await pg.waitForTimeout(400);return pg.evaluate(()=>{const t=document.querySelector('#toast');return t?t.textContent:''})};
const click=async s=>{await pg.click(s);await pg.waitForTimeout(350)};
const x=(a,extra='')=>`[data-x="${a}"]${extra}`;
const login=async(email)=>{await click(x('ct-step','[data-s=entrar]'));await pg.fill('#ct-email',email);await click(x('ct-send'));await pg.fill('#ct-otp','123456');await click(x('ct-verify'));await pg.waitForTimeout(600);await abrirConta()};
const signup=async(papel,nome,email)=>{await click(x('ct-step','[data-s=criar]'));await click(x('ct-papel',`[data-p=${papel}]`));await pg.fill('#ct-nome',nome);await pg.fill('#ct-email',email);await pg.check('#ct-ok1');await pg.check('#ct-ok2');await click(x('ct-send'));await pg.fill('#ct-otp','123456');await click(x('ct-verify'));await pg.waitForTimeout(600);await abrirConta()};
// depois do login o app segue para o aluno ou para a área PRO; daqui abre a conta
const abrirConta=async()=>{if(await pg.isVisible(x('role-back')))await click(x('role-back'));else if(await pg.isVisible(x('ptab','[data-t=perfil]')))await click(x('ptab','[data-t=perfil]'));if(await pg.isVisible(x('ct-open')))await click(x('ct-open'));await pg.waitForTimeout(600)};
const sair=async()=>{await click(x('ct-sair'));await pg.waitForTimeout(300);ok(await pg.isVisible(x('ct-step','[data-s=entrar]')),'ao sair volta para o login')};
const R=[];const ok=(c,m)=>{R.push((c?'ok   ':'FALHA ')+m)};
// 1 tela inicial
ok(await pg.isVisible(x('ct-step','[data-s=criar]'))&&await pg.isVisible(x('ct-step','[data-s=entrar]')),'app abre no login');
ok(!(await pg.isVisible(x('ct-close')))&&!(await pg.isVisible(x('role-aluno'))),'não dá para pular o login');
await shot('0-inicio');
// 2 personal cria conta
await click(x('ct-step','[data-s=criar]'));await click(x('ct-papel','[data-p=personal]'));
ok(await pg.isVisible('#ct-nome'),'tela de criar conta');
await shot('1-criar-conta');
await pg.fill('#ct-nome','Paulo Ramos');await pg.fill('#ct-email','paulo@teste.com');
await click(x('ct-send'));ok(/caixinhas/.test(await toast()),'sem aceite não envia');
await pg.check('#ct-ok1');await pg.check('#ct-ok2');await click(x('ct-send'));
ok(await pg.isVisible('#ct-otp'),'tela do código');await shot('2-codigo');
await pg.fill('#ct-otp','999999');await click(x('ct-verify'));ok(/errado/.test(await toast()),'código errado avisa');
await pg.fill('#ct-otp','123456');await click(x('ct-verify'));await pg.waitForTimeout(700);
ok(await pg.isVisible('#rg-num'),'personal cai no cadastro do CREF');
await pg.fill('#rg-num','12345');await pg.selectOption('#rg-uf','MG');await pg.waitForTimeout(200);
ok((await pg.textContent('#rg-prev')).includes('012345-G/MG'),'monta o CREF no formato');
await click(x('ct-reg-save'));ok(/foto/.test(await toast()),'exige documento');
await pg.setInputFiles('#rg-doc',SC+'/cref.png');await pg.waitForTimeout(400);
await shot('3-cadastro-cref');
await click(x('ct-reg-save'));ok(/declara/.test(await toast()),'exige declaração');
await pg.check('#ct-ok2');await click(x('ct-reg-save'));await pg.waitForTimeout(700);
ok((await pg.textContent('#app')).includes('em análise'),'status em análise');await shot('4-em-analise');
ok(await pg.evaluate(()=>Object.keys(FF_STUB_DB.docs).length===1),'documento enviado');
// pendente não abre a área
await click(x('ct-close'));await pg.waitForTimeout(300);
await click(x('role-pro'));ok((await pg.textContent('#app')).includes('em análise'),'pendente não entra na área do professor');
await sair();
// 3 admin
await signup('aluno','Equipe Foco','adm@teste.com');
await pg.evaluate(()=>{const s=FF_STUB_DB.sess.uid;FF_STUB_DB.profiles[s].papel='admin';FF_STUB_DB.profiles[s].codigo_vinculo=null;FF_STUB_SAVE()});
await pg.reload();await pg.waitForTimeout(700);await abrirConta();
ok((await pg.textContent('#app')).includes('Paulo Ramos'),'admin vê a fila');await shot('5-admin-fila');
await click(x('ad-rev','[data-s=aprovado]'));await pg.waitForTimeout(600);
ok(await pg.evaluate(()=>Object.values(FF_STUB_DB.prof)[0].status==='aprovado'),'admin aprova');
await sair();
// 4 aluna
await signup('aluno','Maria Souza','maria@teste.com');
const cod=await pg.textContent('#ct-cod');ok(/^FF-[0-9A-F]{8}$/.test(cod),'aluna recebe código '+cod);
await click(x('ct-r-add'));await pg.fill('#rf-item','Amendoim');await click(x('rf-save'));await pg.waitForTimeout(600);
ok((await pg.textContent('#app')).includes('Amendoim'),'aluna anota alergia');
await shot('6-aluna-codigo');
await sair();
// 5 personal pede vínculo
await login('paulo@teste.com');
ok((await pg.textContent('#app')).includes('Registro conferido'),'personal aprovado');
await pg.fill('#ct-pedir','FF-00000000');await click(x('ct-pedir'));ok(/não encontrado/.test(await toast()),'código errado');
await pg.fill('#ct-pedir',cod.toLowerCase());await click(x('ct-pedir'));await pg.waitForTimeout(600);
ok((await pg.textContent('#app')).includes('Esperando o aluno'),'pedido pendente');
await sair();
// 6 aluna aceita
await login('maria@teste.com');
ok(await pg.isVisible('.ct-req'),'aluna vê o pedido');await shot('7-pedido');
await click(x('ct-resp','[data-a="1"]'));await pg.waitForTimeout(700);
ok((await pg.textContent('#app')).includes('Meus profissionais'),'aceito');
await click(x('ct-close'));await pg.waitForTimeout(300);
ok(await pg.isVisible('.ob, [data-act=ob-next]'),'aluna segue para o app depois do login');
await click(x('role-back'));await click(x('role-pro'));ok(await pg.isVisible('.ct'),'aluna não entra na área do professor');
await sair();
// 7 personal vê aluna com alerta
await login('paulo@teste.com');
ok(await pg.isVisible('.ct-alert'),'alerta de alergia grave na lista');await shot('8-meus-alunos');
await click(x('ct-al'));await pg.waitForTimeout(300);await shot('9-aluna-detalhe');
ok(!(await pg.isVisible('.sheet '+x('ct-r-add'))),'personal não edita alergias');
await click('.sheet [data-close]');
await click(x('ct-to-pro'));await pg.waitForTimeout(400);
ok(await pg.isVisible('.phead')&&(await pg.textContent('#app')).includes('FOCO FIT PRO'),'personal aprovado entra na área de treinos');
// 8 recarrega: continua logado
await pg.reload();await pg.waitForTimeout(800);
ok((await pg.textContent('#app')).includes('FOCO FIT PRO'),'continua na área após reabrir');
console.log(R.join('\n'));console.log('erros:',errs.length?errs:'nenhum');
await br.close();})();
