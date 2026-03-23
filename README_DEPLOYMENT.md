# 🚀 NexoCRM - Complete Deployment Guide

Bem-vindo! Este diretório contém tudo que você precisa para fazer deploy da sua aplicação NexoCRM em produção na AWS.

## 📚 Documentação disponível

### 1. **[QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md)** ⚡
**Comece aqui se tem pressa!** Resumo em 8 passos simples de tudo o que você precisa fazer.
- GitHub setup
- AWS infrastructure básica
- Deploy manual no EC2
- Domínio e SSL
- ~2-3 horas total

### 2. **[DEPLOYMENT.md](./DEPLOYMENT.md)** 📖
**Documentação completa e detalhada** com instruções passo a passo para cada fase.
- 7 fases de deployment
- Comandos prontos para copiar/colar
- Explicações detalhadas de cada etapa
- Dicas de segurança e produção

### 3. **[DEPLOYMENT_TIMELINE.md](./DEPLOYMENT_TIMELINE.md)** 📅
**Visual timeline e architecture diagram**
- Diagrama da arquitetura em produção
- Timeline estimada para cada fase
- Checklist completo
- Estimativa de custos

### 4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** 🔧
**Problemas comuns e como resolver**
- 10+ problemas comuns e soluções
- Comandos de debug
- Monitoring e logs
- Performance tuning
- Security best practices

### 5. **[.env.production.example](./.env.production.example)** ⚙️
**Template de variáveis de ambiente**
- Copie este arquivo para `.env.production`
- Substitua os valores com seus próprios
- **NÃO COMMITA na versão real no Git!**

---

## 🎯 Como começar?

### Option A: Pressa (QUICK START) - 2-3 horas

```bash
# 1. Leia: QUICK_START_DEPLOYMENT.md
# 2. Execute passo a passo
# 3. Seu app em produção!
```

### Option B: Completo - 4-5 horas

```bash
# 1. Leia: DEPLOYMENT.md (fases 1-7)
# 2. Execute cada fase
# 3. Valide com TROUBLESHOOTING.md
# 4. Seu app completamente configurado!
```

### Option C: Entender tudo - 1-2 dias

```bash
# 1. Estude DEPLOYMENT_TIMELINE.md (architecture)
# 2. Leia DEPLOYMENT.md (completo)
# 3. Execute com QUICK_START_DEPLOYMENT.md (atalhos)
# 4. Use TROUBLESHOOTING.md (quando precisar)
# 5. Seu app pronto para produção!
```

---

## 📋 Arquivos de Configuração

Estes arquivos já foram criados no seu repositório:

```
/nexo
├── Dockerfile                          # Backend container
├── docker-compose.prod.yml            # Production services
├── .github/workflows/deploy.yml        # CI/CD pipeline
├── scripts/deploy.sh                   # Deployment script
├── backend/Dockerfile                 # Backend image config
├── frontend/Dockerfile                # Frontend image config
└── .env.production.example             # Template de env vars
```

---

## 🗺️ Roadmap de Deploy

### Fase 1: Preparação (30 min)
- [ ] Criar repositório GitHub
- [ ] Setup AWS account
- [ ] Gerar variáveis de ambiente

### Fase 2: AWS Infrastructure (60 min)
- [ ] RDS MySQL
- [ ] EC2 instance
- [ ] S3 + CloudFront
- [ ] ECR repositories

### Fase 3: Backend Deploy (45 min)
- [ ] SSH into EC2
- [ ] Docker setup
- [ ] Build backend image
- [ ] Database migrations

### Fase 4: Frontend Deploy (15 min)
- [ ] Build frontend image
- [ ] Start container
- [ ] Verify access

### Fase 5: Domain & SSL (60 min)
- [ ] register domain
- [ ] Configure DNS
- [ ] Let's Encrypt certificate

### Fase 6: CI/CD (20 min)
- [ ] GitHub secrets
- [ ] GitHub Actions test

---

## 💡 Resumo Técnico Rápido

### Arquitetura de Produção

```
Internet
   ↓
HTTPS (TLS/SSL)
   ↓
CloudFront + Route 53
   ├→ https://yourdomain.com → S3 (frontend)
   └→ https://api.yourdomain.com → EC2 (backend)
        ↓
   Docker Containers
   ├→ Backend (Node/Express)
   └→ Frontend (Next.js)
        ↓
   RDS MySQL (database)
```

### Custos Estimados
- **EC2 t3.micro:** ~$9/mês
- **RDS db.t3.micro:** ~$15/mês
- **S3 + CloudFront:** ~$5-20/mês
- **Total:** ~$26-76/mês (Free Tier primeiro ano)

### Tecnologias
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Frontend:** Next.js 14 + React 18 + Tailwind CSS
- **Database:** MySQL 8.0
- **Hosting:** AWS (EC2, RDS, S3, CloudFront)
- **CI/CD:** GitHub Actions
- **Containers:** Docker + Docker Compose

---

## 🚨 Coisas Importantes

### 🔐 Segurança
- **NUNCA** commit `.env.production` no Git
- Use AWS Secrets Manager para secrets em produção
- Rotacione keys regularmente
- Habilite encryption em RDS/S3

### 📊 Monitoring
- Monitore logs regularly
- Setup CloudWatch alarms
- Teste backups regularmente
- Mantenha documentação atualizada

### 💾 Backups
- RDS faz backup automático (7 dias)
- Crie snapshots periodicamente
- Teste restore procedures
- Document disaster recovery plan

### 🔧 Manutenção
- Atualize packages periodicamente
- Revise logs para erros
- Monitore performance
- Scale conforme necessário

---

## 📞 Próximos Passos

1. **Escolha seu path:** Quick Start vs Completo
2. **Leia o documento apropriado:** QUICK_START_DEPLOYMENT.md ou DEPLOYMENT.md
3. **Execute passo a passo:** Não pule etapas!
4. **Teste tudo:** Valide health endpoints
5. **Monitore:** Watch logs após deployment
6. **Otimize:** Use TROUBLESHOOTING.md para melhorias

---

## 📚 Recursos Úteis

- [AWS Free Tier](https://aws.amazon.com/free/)
- [Docker Documentation](https://docs.docker.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)

---

## ✅ Validation Checklist

Após deploy, valide:

- [ ] Backend health check: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads: `curl https://yourdomain.com`
- [ ] Can login with demo@nexocrm.com / demo123
- [ ] Dashboard displays data
- [ ] Can view clients, pipeline, tasks, reports
- [ ] API calls work without CORS errors
- [ ] Logs show no errors
- [ ] SSL certificate is valid

---

## 🆘 Troubleshooting Rápido

**Backend não conecta ao RDS?**
```bash
# Check security group rules
aws ec2 describe-security-groups
```

**Frontend em blank page?**
```bash
# Check frontend env variables
docker exec nexocrm-frontend cat .env.production.local
```

**Migrations falharam?**
```bash
# View migration history
docker exec nexocrm-db mysql -u root -p -e "SELECT * FROM _prisma_migrations"
```

Mais problemas? Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎉 Você Consegue!

Este é um projeto profissional completo. Seguindo estes steps, você terá uma aplicação de CRM production-ready em produção.

- ✅ Código versionado no GitHub
- ✅ Infrastructure as Code (Docker)
- ✅ CI/CD automatizado (GitHub Actions)
- ✅ Monitoring e logs
- ✅ SSL/TLS
- ✅ Scalable na AWS

**Boa sorte! 🚀**

---

**Última atualização:** Março 2026  
**Versão:** 1.0  
**Status:** Ready for Production
