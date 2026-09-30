# NexoCRM — base de conhecimento

CRM multiempresa (multi-tenant) em produção em https://crm.aria.social.br, usado pela V4 NK & Co.
Consulte este arquivo antes de mudar regras de negócio, publicar ou mexer em dados.
Dados de acesso ao servidor e o passo a passo exato de deploy ficam em `CLAUDE.local.md` (fora do git).

## Mantendo este arquivo

- Ao terminar uma tarefa que muda uma regra de negócio, integração, infraestrutura ou procedimento, atualize este arquivo na mesma tarefa (e inclua a mudança no commit).
- Informações de servidor, credenciais ou caminhos da máquina do usuário vão em `CLAUDE.local.md`, nunca aqui. Nunca escreva tokens ou senhas em nenhum dos dois.
- Registre o que não dá para deduzir lendo o código: o porquê das regras, armadilhas encontradas, decisões do usuário. Corrija ou remova o que ficar desatualizado em vez de acumular.

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend (`frontend/`) | Next.js 14.1 (App Router), React 18, TypeScript, Tailwind + componentes próprios em `src/components/ui` (Radix Dialog, lucide-react), TanStack Query v5, axios |
| Backend (`backend/`) | Node 20, Express 4, TypeScript (compila para `dist/`), Prisma 5, JWT (`jsonwebtoken`), bcryptjs |
| Banco | MySQL no AWS RDS (`nexocrm`), migrações Prisma em `backend/prisma/migrations` |
| Infra | EC2 Ubuntu com Docker Compose (`docker-compose.prod.yml`): containers `nexocrm-backend` (3001), `nexocrm-frontend` (3000) e `nexocrm-caddy` (HTTPS; `/api/*` → backend, resto → frontend) |
| Integração | n8n em https://n8n.aria.social.br (cadastro automático de leads, ver abaixo); API4Com para ligações (ver abaixo) |

Não há testes automatizados nem ESLint configurado (`next lint` abre um assistente interativo). A validação é o TypeScript.

## Estrutura e convenções

- Backend: cada módulo em `backend/src/modules/<nome>/` com `routes → controller → service → repository`. Respostas por `sendSuccess` / `sendPaginated` (`src/utils/response.ts`), erros por classes em `src/utils/errors.ts`.
- Autenticação: middleware `authenticate` coloca `req.user` (`id, email, name, role, tenantId, companyName`) a partir do JWT; `requireAdmin` restringe a `ADMIN`. `requireAdmin` responde **401**, e o frontend desloga o usuário em qualquer 401.
- Escopo de dados: quase tudo é filtrado por empresa com `user: { tenantId }`. Clientes, negociações e pipeline são compartilhados por todos os usuários da empresa.
- Frontend: telas em `frontend/src/modules/<nome>/*-view.tsx`, rotas em `src/app/(dashboard)/<rota>/page.tsx`. API via `src/lib/api.ts` (baseURL `/api`, token em `localStorage` `nexo_token` / `nexo_user`).
- Nome da empresa exibido (barra lateral, título da aba, dashboard, tela de login) = `tenants.name`, copiado para o JWT e para `nexo_user` no login. Não há tela para editar; hoje muda por migração de dados, e os usuários só veem o nome novo depois de sair e entrar de novo.
- React Query com `staleTime` de 30s. O cache é limpo no login (`login-form.tsx`) e no logout (`use-auth.ts`); sem isso um usuário via dados do anterior.
- Para escolher cliente use `ClientPicker` (`src/components/ui/client-picker.tsx`: busca no servidor e paginação). `/clients` limita `limit` a 100; não crie selects com uma lista fixa de clientes.
- Comentários no código em inglês; interface em português.

## Regras de negócio

### Clientes e duplicados
- Criar cliente cria automaticamente uma negociação na primeira etapa do pipeline (menor `order`), com valor 0 e o nome do cliente.
- `POST /clients` não duplica: se a empresa já tem cliente com o mesmo `placeId` (Google), ou o mesmo CNPJ (comparado sem zeros à esquerda) **e** o mesmo telefone (só dígitos), devolve o existente com status 200 e não cria outra negociação. CNPJ sozinho não basta porque redes (ex.: Droga Raia) têm o mesmo CNPJ em várias filiais.
- Em 23/09/2026 foram removidos 229 clientes duplicados e 228 negociações automáticas sem uso. Backup no servidor em `~/backup-clients-deals-2026-09-23.json`.

### Leads do n8n
- Workflow "Leads Google Meu Negócio (Outscraper -> Sheets)" (id `SUFTfL8P0z3l24t1`), a cada 2 horas: busca empresas no Outscraper, procura o CNPJ na Casa dos Dados (descarta quem não tem), grava no Google Sheets e faz `POST https://crm.aria.social.br/api/clients` com `placeId`.
- Autentica com um JWT **sem expiração** do usuário Renato Kuroe (admin), escrito no cabeçalho do nó "CRM - Criar Cliente" (escolha do usuário). Trocar o `JWT_SECRET` do servidor invalida esse token e desloga todos os usuários.
- Editar o workflow pela ferramenta do n8n só salva um rascunho: é preciso publicar para a versão ativa mudar.
- Qualquer campo novo enviado pelo n8n precisa existir no backend antes: o cadastro repassa o corpo para o Prisma, e um campo desconhecido gera erro.

### Ligações (API4Com)
- Botão "Ligar" (ícone de telefone) na lista de clientes, nos cards do pipeline e nas ações do dia do tipo Ligação. Componentes `CallButton` e `CallHistory` em `frontend/src/components/ui/`; backend em `backend/src/modules/calls/`.
- Fluxo: `POST /api/calls` → `POST https://api.api4com.com/api/v1/calls` com `caller` = `extension` = ramal do usuário. A API4Com toca primeiro o ramal do vendedor; quando ele atende, liga para o lead. O telefone do cliente é convertido para `+55DDDNÚMERO` (`toE164BrazilPhone`).
- Cada usuário precisa do ramal em `users.phoneExtension`, cadastrado em Admin > Usuários > editar. Sem ramal, a API responde 400 com a orientação.
- Um único token da API4Com para o servidor todo (`API4COM_API_TOKEN`, sem "Bearer"). Serve para uma empresa só; se outra empresa do CRM usar ligações, o token terá de passar a ser por empresa.
- Fim da chamada: a API4Com envia o webhook `channel-hangup` para `/api/calls/webhook?secret=<API4COM_WEBHOOK_SECRET>`, identificado por `metadata.callId`. A rota é pública e protegida só pelo segredo. O webhook é registrado uma vez por `configureApi4comWebhook` (comando em `api4com.client.ts`), com o gateway `nexocrm`; ligações sem esse gateway (feitas fora do CRM) não chegam aqui.
- O webhook pode chegar mais de uma vez por ligação (perna do ramal e perna do lead): mantemos o melhor status, a maior duração e a gravação. A regra de status (`statusFromHangup`) foi escrita pela documentação, sem ter visto um webhook real; confira na primeira ligação.
- Erros da API4Com viram 502, nunca 401 (o frontend desloga em qualquer 401).
- O histórico de ligações é da empresa toda e aparece nos modais de editar cliente e de dados do cliente no pipeline.

### Pipeline
- Etapas (por empresa, em ordem): Prospecção → Tentativa de conexão → Conexão estabelecida → Reunião agendada → No Show → Reunião realizada (funil de SDR, desde 27/09/2026).
- Em `backend/src/modules/reports/dashboard-insight-rules.ts`: `wonStageName = "Reunião realizada"` (base de receita, conversão, ticket médio, LTV e receita por mês) e `closedStageNames = ["Reunião realizada", "No Show"]` (fora de "Negociações Ativas" e dos alertas). **As regras dependem do nome das etapas**: renomear etapa exige ajustar esse arquivo.
- Empresas novas recebem as etapas de `backend/src/modules/admin/tenant-bootstrap.ts`.
- Edição de negociação (`PUT /pipeline/deals/:id`) aceita só título, valor, descrição, cliente (`null` desvincula) e data de fechamento. Mudança de etapa só pela rota `move`.

### Cadências
- Criar e editar é só para admin (`requireAdmin`). As cadências ativas aparecem para todos da empresa; qualquer usuário inscreve clientes.
- Cada etapa tem `delayDays` = dias **após a etapa anterior** (acumulado). A tela mostra "Dia N", com o dia da inscrição como Dia 1.
- Ao inscrever, todas as tarefas são criadas de uma vez, com vencimento às 09:00 (hora do servidor, que está em UTC) + dias acumulados. As tarefas pertencem a quem inscreveu.
- Um cliente só pode estar uma vez em cada cadência (`@@unique([cadenceId, clientId])`, a API responde 409). Uma cadência aceita vários clientes.
- Editar uma cadência vale só para inscrições futuras; tarefas já geradas não mudam. Etapas removidas deixam as tarefas com `cadenceStepId = null`.
- Ainda não existe: arquivar/excluir cadência, pausar/encerrar inscrição, e o status nunca vira "Concluída" sozinho.

### Tarefas e dashboard
- Tarefas avulsas são da empresa toda; tarefas de cadência só aparecem para quem inscreveu o cliente (`visibleTasksWhere` em `tasks.repository.ts`). Vale também para editar/concluir/excluir e para o KPI "Tarefas Pendentes".
- Bloco "Ações do dia" no dashboard: tarefas de cadência do usuário, não concluídas, com vencimento até o fim de hoje (inclui atrasadas), de inscrições ativas. Nenhum alerta é enviado fora do app.

### Pendências conhecidas
- A tela de Tarefas ainda usa uma lista de no máximo 100 clientes no cadastro (trocar por `ClientPicker`).
- Criar ou editar negociação não confere se o cliente é da mesma empresa.
- Textos "Receita Total", "Desempenho de Receita" e "Conversão de Vendas" ainda não refletem o funil de reuniões.

## Validar, commitar e publicar

- Validar: `cd backend && npx tsc --noEmit -p .` e `cd frontend && npx tsc --noEmit -p .`. Após mudar o `schema.prisma`, rode `npx prisma generate` no backend.
- Migração nova: crie a pasta em `backend/prisma/migrations/<timestamp>_<nome>/migration.sql`. Dá para conferir o SQL com `npx prisma migrate diff --from-schema-datamodel <schema antigo> --to-schema-datamodel prisma/schema.prisma --script`.
- **Sempre peça confirmação ao usuário antes de commit, deploy ou qualquer alteração de dados em produção.**
- Commits direto na `main`, com mensagem no formato `tipo: resumo` (feat, fix, chore…) e o trailer `Co-Authored-By` indicado pelo Claude Code. Não commite `.claude/` nem `CLAUDE.local.md`. O `frontend/tsconfig.tsbuildinfo` é versionado e muda sempre que o TypeScript roda.
- Se o git reclamar de identidade, use a dos commits anteriores só no commit: `git -c user.name="Timo" -c user.email="timo@Renatos-MacBook-Pro.local" commit …` (sem alterar a configuração global).
- Deploy: o servidor faz `git pull` e constrói as imagens Docker lá mesmo. Passo a passo em `CLAUDE.local.md`. Não use `scripts/deploy.sh`: ele derruba todos os containers, inclusive o Caddy.
- Armadilha do frontend: o volume `nexocrm_frontend-next-static` guarda `/app/.next/static`. Ele precisa ser removido a cada deploy do frontend, senão a imagem nova sobe com os arquivos antigos e as páginas quebram.
- Consultas em produção: envie um script Node por stdin para `docker exec -i nexocrm-backend node -` (o Prisma Client já está no container). Faça primeiro só leitura ou simulação e backup antes de apagar dados.
