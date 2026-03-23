# Guia Completo: Deploy do CRM Nexo em Produção (GitHub + AWS)

## 📋 Sumário
1. GitHub Setup
2. Preparação do Código
3. AWS Infrastructure
4. CI/CD Pipeline
5. Configuração de Domínio
6. Monitoramento e Logs

---

## FASE 1: GITHUB SETUP

### 1.1 Criar Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Configure:
   - **Repository name:** `nexocrm`
   - **Description:** "Scalable CRM Platform with Next.js & Node.js"
   - **Visibility:** Private (ou Public conforme preferência)
   - **Initialize repository:** Deixar desmarcado
   - **Add .gitignore:** Node (optional, vamos criar own)
   - **License:** MIT

3. **Clique em "Create repository"**

### 1.2 Configurar Git Localmente

```bash
cd /Volumes/External/Projects/www/nexo

# Inicializar Git
git init

# Criar .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/
.next/
out/

# Environment variables (NEVER commit secrets)
.env
.env.local
.env.*.local
.env.production.local
.env.production

# OS
.DS_Store
.AppleDouble
.LSOverride
Thumbs.db
*.ide/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log
npm-debug.log*

# Temporary
tmp/
temp/
EOF

# Adicionar remoto
git remote add origin https://github.com/YOUR_USERNAME/nexocrm.git

# Commit inicial
git add .
git commit -m "Initial commit: Scalable CRM with Express + Next.js + Prisma"
git branch -M main
git push -u origin main
```

### 1.3 Configurar Secrets no GitHub

Acesse: **Settings → Secrets and variables → Actions**

Adicione os seguintes secrets:
- `AWS_ACCESS_KEY_ID` - AWS Access Key
- `AWS_SECRET_ACCESS_KEY` - AWS Secret Key
- `AWS_REGION` - us-east-1 (ou sua região preferida)
- `RDS_MASTER_PASSWORD` - Senha forte para RDS MySQL

---

## FASE 2: PREPARAÇÃO DO CÓDIGO

### 2.1 Criar Dockerfiles

#### Backend - `/backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm run build

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "run", "start"]
```

#### Frontend - `/frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### 2.2 Criar docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: nexocrm-backend:latest
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://root:${RDS_PASSWORD}@${RDS_HOST}:3306/nexocrm
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: https://yourdomain.com
      API_PORT: 3001
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    image: nexocrm-frontend:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${RDS_PASSWORD}
      MYSQL_DATABASE: nexocrm
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### 2.3 Adicionar Scripts de Deploy

Crie `/scripts/deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Build images
echo "📦 Building Docker images..."
docker build -t nexocrm-backend:latest ./backend
docker build -t nexocrm-frontend:latest ./frontend

echo "✅ Build complete!"
echo "Next steps:"
echo "1. Push images to ECR: aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com"
echo "2. Tag images: docker tag nexocrm-backend:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexocrm-backend:latest"
echo "3. Push: docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexocrm-backend:latest"
```

---

## FASE 3: AWS INFRASTRUCTURE

### 3.1 Criar RDS MySQL

**Via AWS Console:**

1. Acesse **RDS Dashboard → Databases → Create database**
2. Configure:
   - **Engine:** MySQL 8.0
   - **DB Instance Class:** db.t3.micro (free tier eligible)
   - **Master Username:** admin
   - **Master Password:** [senha forte, salve no AWS Secrets Manager]
   - **DB Instance Identifier:** nexocrm-prod
   - **Storage:** 20 GB, gp3, autoscaling até 100GB
   - **VPC:** default
   - **Publicly accessible:** No
   - **backup:** 7 dias retention

3. **Clique em "Create database"**
4. Aguarde 5-10 minutos para status ficar "Available"
5. **Copie o Endpoint** (ex: `nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com`)

### 3.2 Criar EC2 para Backend

**Via AWS Console:**

1. Acesse **EC2 Dashboard → Launch Instances**
2. Configure:
   - **AMI:** Ubuntu 22.04 LTS (Free tier eligible)
   - **Instance Type:** t3.micro
   - **Key Pair:** Crie nova (salve em local seguro)
   - **Security Group:** Abra portas:
     - 22 (SSH) - seu IP
     - 3001 (Backend) - 0.0.0.0/0
     - 443 (HTTPS) - 0.0.0.0/0
     - 80 (HTTP) - 0.0.0.0/0

3. **Launch Instance**

### 3.3 Criar S3 + CloudFront para Frontend

```bash
# Create S3 bucket
aws s3 mb s3://nexocrm-frontend --region us-east-1

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket nexocrm-frontend \
  --website-configuration '{"IndexDocument": {"Suffix": "index.html"}, "ErrorDocument": {"Key": "404.html"}}'

# Block public access (via CloudFront only)
aws s3api put-public-access-block \
  --bucket nexocrm-frontend \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

CloudFront distribution via Console:
1. Acesse **CloudFront → Create distribution**
2. **Origin domain:** seu-bucket.s3.us-east-1.amazonaws.com
3. **Origin access control:** Create OAC
4. **Viewer policy:** Redirect HTTP to HTTPS
5. **Cache policy:** Managed CachingOptimized
6. **Create Distribution**

### 3.4 Criar ECR para Armazenar Imagens Docker

```bash
# Create registry for backend
aws ecr create-repository --repository-name nexocrm-backend --region us-east-1

# Create registry for frontend
aws ecr create-repository --repository-name nexocrm-frontend --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
```

---

## FASE 4: CI/CD PIPELINE (GitHub Actions)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com
  BACKEND_REPOSITORY: nexocrm-backend
  FRONTEND_REPOSITORY: nexocrm-frontend

jobs:
  build_and_push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend image
        working-directory: backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$BACKEND_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$BACKEND_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$BACKEND_REPOSITORY:latest
          docker push $ECR_REGISTRY/$BACKEND_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$BACKEND_REPOSITORY:latest

      - name: Build and push frontend image
        working-directory: frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$FRONTEND_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$FRONTEND_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$FRONTEND_REPOSITORY:latest
          docker push $ECR_REGISTRY/$FRONTEND_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$FRONTEND_REPOSITORY:latest

      - name: Deploy backend to EC2
        run: |
          # SSH into EC2 and pull latest image
          ssh -i ${{ secrets.EC2_SSH_KEY }} ubuntu@${{ secrets.EC2_BACKEND_IP }} \
            "cd /app && docker pull $ECR_REGISTRY/$BACKEND_REPOSITORY:latest && docker-compose up -d backend"

      - name: Deploy frontend to S3 + CloudFront
        run: |
          # Upload to S3
          aws s3 sync frontend/out s3://nexocrm-frontend --delete
          # Invalidate CloudFront
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

---

## FASE 5: CONFIGURAÇÃO DE DOMÍNIO

### 5.1 Registrar Domínio

Opções:
- Route 53 (AWS)
- Namecheap
- GoDaddy

### 5.2 Configurar DNS no Route 53

```bash
# Create hosted zone (via console ou CLI)
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Get nameservers e aponte seu domínio registrado

# Create A record para frontend (CloudFront)
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "yourdomain.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "d123.cloudfront.net",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'

# Create A record para API (EC2)
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.yourdomain.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "YOUR_EC2_IP"}]
    }
  }]
}'
```

### 5.3 Configurar SSL/TLS (Let's Encrypt via Certbot)

No EC2:

```bash
# Conectar ao EC2
ssh -i seu-key.pem ubuntu@YOUR_EC2_IP

# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d api.yourdomain.com

# Copiar certificados para aplicação
sudo cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem /app/ssl/
sudo cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem /app/ssl/

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Ou use **AWS Certificate Manager (ACM)** para gerenciar automaticamente.

---

## FASE 6: DEPLOY MANUAL INICIAL (SSH)

### 6.1 Conectar ao EC2

```bash
# SSH into EC2
ssh -i seu-key.pem ubuntu@YOUR_EC2_IP

# Setup do servidor
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git nodejs npm mysql-client

# Start docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Clone do repositório
git clone https://github.com/YOUR_USERNAME/nexocrm.git /app
cd /app
```

### 6.2 Environment Variables em Produção

Crie `/app/.env.production`:

```env
# Backend
NODE_ENV=production
API_PORT=3001
JWT_SECRET=seu-secret-aleatorio-96-chars
DATABASE_URL=mysql://admin:RDS_PASSWORD@nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com:3306/nexocrm
FRONTEND_URL=https://yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 6.3 Rodar Migrações no RDS

```bash
cd /app/backend

# Set production database URL
export DATABASE_URL="mysql://admin:PASSWORD@RDS_ENDPOINT:3306/nexocrm"

# Run migrations
npm run migrate

# Seed data (opcional, criar admin user)
npx ts-node prisma/seed.ts
```

### 6.4 Iniciar Serviços

```bash
cd /app

# Build images
docker build -t nexocrm-backend:latest ./backend
docker build -t nexocrm-frontend:latest ./frontend

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify status
docker ps
```

---

## FASE 7: MONITORAMENTO E LOGS

### 7.1 CloudWatch Logs

```bash
# Backend logs
docker logs -f nexocrm-backend

# Ou via CloudWatch
aws logs tail /ecs/nexocrm-backend --follow
```

### 7.2 Verificar Health

```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend
curl https://yourdomain.com
```

### 7.3 Setup Auto-Scaling (Opcional)

Via Console: **Auto Scaling Groups → Create** e configure triggers baseado em CPU/Memory.

---

## 📝 CHECKLIST FINAL

- [ ] Código commitado e pushed no GitHub
- [ ] RDS MySQL criado e migrações rodadas
- [ ] EC2 instance rodando com Docker
- [ ] ECR repositories criados
- [ ] S3 bucket + CloudFront configurados
- [ ] Domínio registrado e apontando para AWS
- [ ] SSL/TLS configurado
- [ ] Variáveis de ambiente em produção
- [ ] CI/CD pipeline testado
- [ ] Health checks passando
- [ ] Login funcionando com dados de produção
- [ ] Logs e monitoramento configurados

---

## 🆘 Troubleshooting

### "Cannot connect to RDS"
```bash
# Verificar security group do RDS
aws rds describe-db-instances --db-instance-identifier nexocrm-prod

# Adicionar rule para EC2 security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds \
  --protocol tcp \
  --port 3306 \
  --source-group sg-ec2
```

### "Frontend not loading"
- Verificar S3 bucket policy
- CloudFront cache invalidation
- Origin access control (OAC) configurado

### "Backend returning 500"
- Verificar DATABASE_URL
- Checar logs: `docker logs nexocrm-backend`
- Verificar JWT_SECRET matches

---

## 💡 Dicas de Produção

1. **Use managed services**: RDS, ElastiCache, CloudFront ao invés de auto-gerenciar
2. **Auto-scaling**: Configure horizontal scaling baseado em CPU
3. **Backups automáticos**: RDS backup retention policy
4. **Monitoring**: CloudWatch alarms para CPU, memory, errors
5. **Rate limiting**: Implemente no backend para segurança
6. **WAF**: Use AWS WAF para CloudFront
7. **Secrets management**: Use AWS Secrets Manager, não .env em produção
8. **CDN**: Todos os assets estáticos via CloudFront
9. **Database size**: Monitore growth e upgrade instance conforme necessário

---

Próximos passos: Execute as fases em ordem e me avise se precisar de ajuda em qualquer etapa! 🚀
