// Testa as regras de acesso do banco num Postgres local (PGlite), sem servidor.
// Rodar: npm run test:db
import {PGlite} from "@electric-sql/pglite";
import {readFileSync, readdirSync} from "node:fs";
const here = new URL(".", import.meta.url), mig = new URL("../migrations/", import.meta.url);
const db = new PGlite();
await db.exec(readFileSync(new URL("auth_stub.sql", here), "utf8"));
for (const f of readdirSync(mig).sort()) await db.exec(readFileSync(new URL(f, mig), "utf8"));

let ok = 0, fail = 0;
const check = (cond, msg) => { if (cond) ok++; else { fail++; console.log("FALHOU:", msg); } };
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
// roda SQL como um usuário logado (papel authenticated + auth.uid())
async function as(uid, sql, params = []) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`); }
}
async function fails(uid, sql, msg, params = []) {
  try { await as(uid, sql, params); check(false, msg + " (deveria ter sido bloqueado)"); } catch (e) { check(true, msg); }
}
const rows = async (uid, sql, params) => (await as(uid, sql, params)).rows;

const A = id(1), B = id(2), P = id(3), N = id(4), Q = id(5), X = id(6);
const signup = (u, meta) => db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2)", [u, meta]);
await signup(A, {papel: "aluno", nome: "Ana"});
await signup(B, {papel: "aluno", nome: "Bia"});
await signup(P, {papel: "personal", nome: "Paulo"});
await signup(N, {papel: "nutri", nome: "Nina"});
await signup(Q, {papel: "personal", nome: "Quim"});
await signup(X, {papel: "admin", nome: "Esperto"});
check((await db.query("select papel from profiles where id=$1", [X])).rows[0].papel === "aluno", "cadastro como admin vira aluno");
await db.query("update profiles set papel='admin' where id=$1", [X]); // admin real é definido direto no banco
const codA = (await db.query("select codigo_vinculo c from profiles where id=$1", [A])).rows[0].c;
check(/^FF-[0-9A-F]{8}$/.test(codA), "aluno recebe código FF-XXXXXXXX");
check((await db.query("select codigo_vinculo c from profiles where id=$1", [P])).rows[0].c === null, "profissional não tem código");

// cadastro profissional
await fails(P, "insert into profissionais(id, conselho, registro, uf) values ($1,'CREF','12345','SP')", "CREF com formato errado", [P]);
await fails(P, "insert into profissionais(id, conselho, registro, uf) values ($1,'CRN','CRN-3 12345','SP')", "personal não cadastra CRN", [P]);
await fails(A, "insert into profissionais(id, conselho, registro, uf) values ($1,'CREF','012345-G/SP','SP')", "aluno não vira profissional", [A]);
await fails(P, "insert into profissionais(id, conselho, registro, uf) values ($1,'CREF','012345-G/SP','SP')", "ninguém cadastra registro em nome de outro", [Q]);
await as(P, "insert into profissionais(id, conselho, registro, uf, status) values ($1,'CREF','012345-G/SP','SP','aprovado')", [P]);
check((await db.query("select status from profissionais where id=$1", [P])).rows[0].status === "pendente", "profissional não se autoaprova");
await as(N, "insert into profissionais(id, conselho, registro, uf) values ($1,'CRN','CRN-3 45678','SP')", [N]);
await as(Q, "insert into profissionais(id, conselho, registro, uf) values ($1,'CREF','098765-G/RJ','RJ')", [Q]);
await fails(Q, "insert into profissionais(id, conselho, registro, uf) values ($1,'CREF','012345-G/SP','SP')", "registro duplicado", [Q]);

// aprovação pelo admin
await fails(P, "select revisar_profissional($1,'aprovado')", "profissional não aprova a si mesmo", [P]);
await as(X, "select revisar_profissional($1,'aprovado')", [P]);
await as(X, "select revisar_profissional($1,'aprovado')", [N]);
check((await rows(X, "select count(*)::int n from profissionais")).at(0).n === 3, "admin vê os cadastros profissionais");

// vínculo
await fails(Q, "select solicitar_vinculo($1)", "profissional pendente não pede vínculo", [codA]);
await fails(P, "select solicitar_vinculo('FF-00000000')", "código inexistente");
await fails(P, "insert into vinculos(aluno_id, profissional_id, tipo, status) values ($1,$2,'personal','ativo')", "ninguém cria vínculo ativo direto", [A, P]);
await as(P, "select solicitar_vinculo($1)", [codA.toLowerCase()]);
await as(A, "insert into registros_dia(aluno_id, dia, dados) values ($1, '2026-10-29', '{\"agua\":5}')", [A]);
await as(A, "insert into restricoes(aluno_id, tipo, item, gravidade) values ($1,'alergia','amendoim','grave')", [A]);
check((await rows(P, "select * from registros_dia")).length === 0, "pedido pendente não dá acesso aos dados");
check((await rows(P, "select nome from profiles where id=$1", [A])).length === 1, "profissional vê o nome do aluno do pedido");
check((await rows(B, "select * from vinculos")).length === 0, "outro aluno não vê o pedido");
const vP = (await rows(A, "select id from vinculos where profissional_id=$1", [P]))[0].id;
check(!!vP, "aluno vê o pedido");
await fails(P, "select responder_vinculo($1, true)", "profissional não aceita o próprio pedido", [vP]);
await as(A, "select responder_vinculo($1, true)", [vP]);

// personal com vínculo ativo
check((await rows(P, "select * from registros_dia")).length === 1, "personal vê os registros do aluno vinculado");
check((await rows(P, "select * from restricoes")).length === 1, "personal vê as alergias do aluno");
await as(P, "insert into planos_treino(aluno_id, dados) values ($1, '{\"dias\":{}}')", [A]);
await fails(P, "insert into planos_dieta(aluno_id, dados) values ($1, '{}')", "personal não escreve dieta", [A]);
await fails(P, "insert into restricoes(aluno_id, tipo, item) values ($1,'alergia','leite')", "personal não edita alergias", [A]);
await fails(P, "insert into registros_dia(aluno_id, dia) values ($1, '2026-10-30')", "personal não preenche o dia do aluno", [A]);
await fails(P, "insert into planos_treino(aluno_id, dados) values ($1, '{}')", "personal não escreve treino de aluno sem vínculo", [B]);
await as(P, "insert into avaliacoes(aluno_id, peso_kg, gordura_pct, tmb_kcal, metodo) values ($1, 72.4, 31.2, 1430, 'bioimpedância')", [A]);
check((await rows(A, "select * from avaliacoes")).length === 1, "aluno vê a avaliação feita pelo personal");
check((await rows(P, "select * from registros_dia where aluno_id=$1", [B])).length === 0, "personal não vê aluno de outro");

// nutricionista
await as(N, "select solicitar_vinculo($1)", [codA]);
const vN = (await rows(A, "select id from vinculos where profissional_id=$1", [N]))[0].id;
await as(A, "select responder_vinculo($1, true)", [vN]);
await as(N, "insert into planos_dieta(aluno_id, dados) values ($1, '{\"refeicoes\":[]}')", [A]);
await as(N, "insert into restricoes(aluno_id, tipo, item, gravidade) values ($1,'intolerancia','lactose','moderada')", [A]);
await fails(N, "insert into planos_treino(aluno_id, dados) values ($1, '{}')", "nutri não escreve treino", [A]);
check((await rows(P, "select * from planos_dieta")).length === 1, "personal lê a dieta do nutri");
await as(P, "update planos_dieta set dados='{}'");
check((await db.query("select dados->'refeicoes' r from planos_dieta")).rows[0].r !== null, "personal não altera a dieta do nutri");

// perfil protegido
await fails(A, "update profiles set papel='admin' where id=$1", "aluno não vira admin", [A]);
await fails(A, "update profiles set codigo_vinculo='FF-AAAAAAAA' where id=$1", "aluno não escolhe o próprio código", [A]);
await as(A, "update profiles set nome='Ana Paula' where id=$1", [A]);
const novo = (await rows(A, "select trocar_codigo() c"))[0].c;
check(novo !== codA, "aluno troca o código");
await fails(Q, "select solicitar_vinculo($1)", "código antigo para de funcionar", [codA]);

// admin não lê saúde
check((await rows(X, "select * from registros_dia")).length === 0, "admin não lê registros do dia");
check((await rows(X, "select * from restricoes")).length === 0, "admin não lê alergias");
check((await rows(X, "select * from avaliacoes")).length === 0, "admin não lê avaliações");

// auditoria
check((await rows(A, "select * from auditoria")).length >= 4, "aluno vê quem mexeu nos dados dele");
check((await rows(B, "select * from auditoria")).length === 0, "outro aluno não vê a auditoria");
await fails(P, "delete from auditoria", "ninguém apaga a auditoria");

// revogar
await as(A, "select revogar_vinculo($1)", [vP]);
check((await rows(P, "select * from registros_dia")).length === 0, "acesso some quando o aluno revoga");
check((await rows(P, "select * from avaliacoes")).length === 0, "personal revogado não vê mais avaliações");
await as(X, "select revisar_profissional($1,'bloqueado','teste')", [N]);
check((await rows(N, "select * from planos_dieta")).length === 0, "profissional bloqueado perde o acesso");
await fails(N, "update profissionais set registro='CRN-3 99999' where id=$1", "bloqueado não reabre o próprio cadastro", [N]);
check((await rows(B, "select * from profiles where id=$1", [A])).length === 0, "aluno não vê perfil de outro aluno");

// anônimo
await db.exec("set role anon");
let anonOk = true; try { await db.query("select * from profiles"); anonOk = false } catch (e) {}
await db.exec("reset role");
check(anonOk, "sem login não lê nada");

console.log(`${ok} regras ok, ${fail} falharam`);
process.exit(fail ? 1 : 0);
