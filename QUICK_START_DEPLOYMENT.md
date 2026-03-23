# ⚡ Quick Start Deployment Guide (Resumido)

## 1️⃣ GitHub Setup (5 min)

```bash
# Inicializar repositório local
cd /Volumes/External/Projects/www/nexo
git init
git add .
git commit -m "Initial commit: NexoCRM application"

# Adicionar seu repositório GitHub
git remote add origin https://github.com/YOUR_USERNAME/nexocrm.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ AWS Setup (30 min)

### A️⃣ Criar RDS MySQL (Gerenciado)

1. Acesse [AWS Console → RDS](https://console.aws.amazon.com/rds)
2. **Create database**
   - Engine: MySQL 8.0
   - Instance class: db.t3.micro (free tier)
   - Master password: [senha forte]
   - Identifier: `nexocrm-prod`
3. Copie o Endpoint gerado (ex: `nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com`)

### B️⃣ Criar EC2 para Backend

1. Acesse [AWS Console → EC2](https://console.aws.amazon.com/ec2)
2. **Launch Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.micro
   - Security Group: Abrir portas 22, 80, 443, 3001
   - Key Pair: Criar e salvar em local seguro
3. Copie o IP elástico da instância

### C️⃣ Criar S3 + CloudFront para Frontend

```bash
# Create S3 bucket
aws s3 mb s3://nexocrm-frontend --region us-east-1

# Create CloudFront distribution via Console e aponte para o bucket S3
```

### D️⃣ Criar ECR para imagens Docker

```bash
# Backend registry
aws ecr create-repository --repository-name nexocrm-backend --region us-east-1

# Frontend registry
aws ecr create-repository --repository-name nexocrm-frontend --region us-east-1
```

---

## 3️⃣ Configurar Environment Variables

### Criar `.env.production` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://admin:SUA_SENHA_RDS@nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com:3306/nexocrm

# JWT
JWT_SECRET=seu-secret-aleatorio-de-96-caracteres-gere-um-com-openssl

# URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# MySQL
MYSQL_ROOT_PASSWORD=sua-senha-rds-aqui
```

Gerar JWT_SECRET:
```bash
openssl rand -hex 48
```

---

## 4️⃣ Deploy no EC2 (Manual)

### Conectar ao EC2:

```bash
ssh -i sua-chave.pem ubuntu@SEU_EC2_IP
```

### No EC2:

```bash
# Instalar dependências
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# Iniciar Docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Clone do repositório
git clone https://github.com/YOUR_USERNAME/nexocrm.git /app
cd /app

# Copiar .env.production
nano .env.production
# Cole as variáveis de ambiente e salve (Ctrl+O, Enter, Ctrl+X)

# Login na ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build das imagens
docker build -t nexocrm-backend:latest ./backend
docker build -t nexocrm-frontend:latest ./frontend

# Rodar migrations
docker run --rm -e DATABASE_URL="$DATABASE_URL" nexocrm-backend npm run migrate

# Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker ps
docker logs -f nexocrm-backend
```

---

## 5️⃣ Configurar Domínio

1. **Registrar domínio:** Route 53, Namecheap, GoDaddy
2. **Apontar nameservers** para Route 53 (se usar AWS)
3. **No Route 53**, criar records:
   - `yourdomain.com` → CloudFront distribution
   - `api.yourdomain.com` → EC2 IP

---

## 6️⃣ Setup SSL/HTTPS

No EC2:

```bash
# Instalar Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d api.yourdomain.com

# Copiar para aplicação
sudo mkdir -p /app/ssl
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /app/ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /app/ssl/

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 7️⃣ Setup CI/CD (GitHub Actions)

No GitHub:

1. Acesse **Settings → Secrets and variables → Actions**
2. Adicione secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_ACCOUNT_ID` (encontre no console AWS)
   - `EC2_SSH_KEY` (seu arquivo .pem encoded em base64)
   - `EC2_BACKEND_IP` (IP da instância)

Arquivo `.github/workflows/deploy.yml` já foi criado. Cada push em `main` vai:
- ✅ Rodar testes
- ✅ Build das imagens Docker
- ✅ Push para ECR
- ✅ Deploy no EC2 (opcional, pode ser manual)

---

## 8️⃣ Validar Deployment

```bash
# Verificar saúde do backend
curl https://api.yourdomain.com/health

# Acessar frontend
https://yourdomain.com

# Login com credenciais demo
Email: demo@nexocrm.com
Senha: demo123
```

---

## 📊 Monitoramento

```bash
# Logs em tempo real
ssh -i sua-chave.pem ubuntu@SEU_EC2_IP
docker logs -f nexocrm-backend
docker logs -f nexocrm-frontend

# Via CloudWatch (AWS Console)
CloudWatch → Logs → selecione seu container
```

---

## 💾 Backup Automático

```bash
# RDS faz backup automático (7 dias por padrão)
# Via Console: RDS → Databases → Automated backups

# MySQL manual (caso necessário)
mysqldump -u admin -p -h RDS_ENDPOINT nexocrm > backup.sql
```

---

## 🚀 Estimativa de Custos (Mensal)

- **EC2 t3.micro**: ~$9
- **RDS db.t3.micro**: ~$15
- **S3 + CloudFront**: ~$2-10 (depende tráfego)
- **Total estimado**: ~$26-34/mês

*Elegível para free tier AWS se novo.*

---

## ❓ Próximos Passos

1. ✅ Fazer push do código no GitHub
2. ✅ Criar RDS e EC2 na AWS
3. ✅ Deploy manual no EC2
4. ✅ Testar acesso em produção
5. ✅ Setup domínio e SSL
6. ✅ Configurar CI/CD automático

**Precisa de ajuda em alguma etapa? Me avisa! 🚀**
