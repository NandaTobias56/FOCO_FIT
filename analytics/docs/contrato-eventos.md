# Contrato de eventos do Foco Fit (v1, 2026-11-02)

Base comum para todas as frentes da pós (PUC Minas, Analytics e BI). Quem mudar algo aqui avisa as outras frentes.

## Tabela `public.eventos` (Supabase / Postgres)

| coluna | tipo | regra |
| --- | --- | --- |
| id | uuid | pk, default gen_random_uuid() |
| aluno_id | uuid | not null, references profiles(id) on delete cascade, default auth.uid() |
| tipo | text | not null, um dos tipos abaixo |
| dia | date | not null, dia local do registro (a chave de dia do app, YYYY-MM-DD) |
| ocorrido_em | timestamptz | not null, hora do aparelho |
| recebido_em | timestamptz | not null, default now() |
| plataforma | text | 'android' ou 'web' |
| app_versao | text | número do build (FF_BUILD) ou null |
| sessao_id | uuid | gerado quando o app abre |
| props | jsonb | not null, default '{}' |

RLS: o aluno só insere e lê os próprios eventos (aluno_id = auth.uid()); ninguém atualiza nem apaga pelo app. Profissional e admin não leem eventos crus. Índice em (aluno_id, ocorrido_em).

## Tipos e props

| tipo | props |
| --- | --- |
| app_aberto | {} |
| refeicao_registrada | {refeicao_id: text, status: 'ok' \| 'troca' \| 'pulei'} |
| refeicao_desfeita | {refeicao_id} |
| treino_feito | {grupo: text (ex. 'gluteos', 'costas')} |
| treino_desfeito | {} |
| cardio_registrado | {minutos: int} |
| agua_copo | {delta: 1 \| -1, total_dia: int} |
| peso_registrado | {kg: number} |
| doce_sos_vencido | {} |
| bau_aberto | {premio: text} |
| promessa_feita | {texto: text} |
| notificacao_tocada | {tipo: 'refeicao' \| 'treino' \| 'agua' \| 'lembrete', acao: 'ok' \| 'abrir'} |

## Dados sintéticos e Databricks

- O gerador sintético produz exatamente estas colunas (CSV ou Parquet, um arquivo por tabela), mais `profiles` (id, papel, nascimento, criado_em) e `vinculos` (aluno_id, profissional_id, estado, criado_em) com as mesmas colunas do Supabase.
- Linhas sintéticas levam `props.sintetico = true` e ids gerados, para nunca se misturarem com dados reais sem querer.
- Bronze no Databricks = cópia fiel destas tabelas, com colunas extras `_ingerido_em` e `_origem` ('supabase' ou 'sintetico').
- Dados de saúde são sensíveis (LGPD): no lakehouse o aluno é identificado só por hash do id; nome e e-mail nunca saem do Supabase.
