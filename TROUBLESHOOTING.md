# 🔧 Troubleshooting & Production Checklist

## Pre-Deployment Checklist

- [ ] Código commitado e pushed no GitHub `main` branch
- [ ] RDS MySQL criado e health check OK
- [ ] EC2 instance rodando e SSH acessível
- [ ] S3 bucket criado e website hosting habilitado
- [ ] CloudFront distribution criado
- [ ] ECR repositories criados
- [ ] Security groups configurados para EC2/RDS
- [ ] IAM user com credenciais AWS para CI/CD
- [ ] Domínio registrado
- [ ] `.env.production` preenchido com valores reais

---

## 🆘 Problemas Comuns & Soluções

### ❌ "Cannot connect to RDS from EC2"

**Causa:** Security group do RDS não permite conexão do EC2

**Solução:**
```bash
# Obtenha o Security Group ID do EC2
aws ec2 describe-instances --instance-ids i-xxxxx \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Adicione ingress rule no RDS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-id \
  --protocol tcp \
  --port 3306 \
  --source-group sg-ec2-id
```

### ❌ "Backend returning 500 on /health"

**Causa:** DATABASE_URL inválida ou MySQL não acessível

**Solução:**
```bash
# SSH into EC2
ssh -i seu-key.pem ubuntu@EC2_IP

# Testar conexão MySQL
mysql -u admin -p -h nexocrm-prod.xxxxx.amazonaws.com nexocrm

# Verificar logs
docker logs nexocrm-backend | tail -50

# Reconstruir containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### ❌ "Frontend showing 'Blank Page' ou 'Cannot reach backend'"

**Causa:** NEXT_PUBLIC_API_URL incorreta ou CORS misconfigured

**Solução:**
```bash
# Verificar URL no frontend container
docker exec nexocrm-frontend cat .env.production.local | grep API_URL

# Verificar CORS no backend
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: GET" \
  https://api.yourdomain.com/health -v

# Se CORS está wrong, checar backend app.ts
```

### ❌ "Migrations failed on deploy"

**Causa:** Schema já existe ou constraint violation

**Solução:**
```bash
# Entrar no container do MySQL
docker exec -it nexocrm-db mysql -u root -p nexocrm

# Listar migrations
SELECT * FROM _prisma_migrations;

# Se problema, reset (⚠️ DEL
ETA DADOS):
# DELETE FROM _prisma_migrations;
# TRUNCATE TABLE _prisma_migrations;

# Re-run migrations
docker run --rm \
  --network nexo-network \
  -e DATABASE_URL="$DATABASE_URL" \
  nexocrm-backend:latest \
  npm run migrate
```

### ❌ "Docker push to ECR fails"

**Causa:** Não autenticado na ECR

**Solução:**
```bash
# Gerar novo login token
aws ecr get-login-password --region us-east-1 | docker login \
  --username AWS \
  --password-stdin YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Verify
docker images
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/nexocrm-backend:latest
```

### ❌ "SSL Certificate fails with Let's Encrypt"

**Causa:** Porta 80/443 não acessível ou DNS não resolvendo

**Solução:**
```bash
# Verificar se porta está aberta
curl http://api.yourdomain.com/.well-known/acme-challenge/test

# Renovar certificado
sudo certbot renew --dry-run

# Se falhar, usar força bruta
sudo certbot certonly --standalone --force-renewal -d api.yourdomain.com
```

### ❌ "Memory/CPU Too High"

**Causa:** Containers usando muitos recursos ou sem limits

**Solução:**
```yaml
# Adicionar ao docker-compose.prod.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

---

## 📊 Monitoring & Debugging

### Ver logs em tempo real

```bash
# Backend
docker logs -f nexocrm-backend

# Frontend
docker logs -f nexocrm-frontend

# MySQL
docker logs -f nexocrm-db

# All at once
docker-compose -f docker-compose.prod.yml logs -f
```

### SSH into containers

```bash
# Backend
docker exec -it nexocrm-backend sh

# Frontend
docker exec -it nexocrm-frontend sh

# MySQL
docker exec -it nexocrm-db mysql -u root -p
```

### Check resource usage

```bash
docker stats

# ou
top
free -h
df -h
```

### Check network connectivity

```bash
# From EC2 to RDS
docker run --rm --network nexo-network alpine\
  sh -c "apk add --no-cache mysql-client && mysql -h nexocrm-db -u root -p"

# From EC2 to outside
curl -I https://api.yourdomain.com/health
```

---

## 🔐 Security Best Practices

### 1. Never commit secrets

```bash
# Add to .gitignore
echo ".env.production" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
git rm --cached .env.production 2>/dev/null
git commit -m "Remove secrets from git history"
```

### 2. Use AWS Secrets Manager (not .env)

```bash
# Store secret
aws secretsmanager create-secret \
  --name nexocrm/prod \
  --secret-string '{"DATABASE_URL":"...","JWT_SECRET":"..."}'

# Retrieve in app
aws secretsmanager get-secret-value --secret-id nexocrm/prod
```

### 3. Rotate keys periodically

- JWT_SECRET: Monthly
- AWS IAM keys: Quarterly
- SSL certificates: Automatic (Let's Encrypt)
- RDS password: Quarterly

### 4. Restrict security groups

```bash
# Only open port 3001 to CloudFront IP ranges or specific IPs
# Never open 3306 (MySQL) to 0.0.0.0!
```

### 5. Enable VPC encryption

- RDS: Enable encryption at rest
- EBS volumes: Enable encryption
- S3: Enable encryption

---

## 📈 Scaling for Production

### Horizontal Scaling (Add more instances)

```bash
# Create AMI from current EC2
aws ec2 create-image --instance-id i-xxxxx --name "nexocrm-prod-v1"

# Launch more instances from AMI
# Use Application Load Balancer (ALB) for traffic distribution
```

### Vertical Scaling (Improve instance)

```bash
# Upgrade EC2 instance type
aws ec2 stop-instances --instance-ids i-xxxxx
# Via console: Change instance type to larger
aws ec2 start-instances --instance-ids i-xxxxx

# Upgrade RDS instance
# Via console: Modify DB Instance → Change Instance Class
# (downtime: ~5-10 minutes)
```

### Database optimization

```bash
# Enable RDS read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier nexocrm-read-replica \
  --source-db-instance-identifier nexocrm-prod

# Add caching layer (ElastiCache Redis)
aws elasticache create-cache-cluster \
  --cache-cluster-id nexocrm-cache \
  --engine redis \
  --cache-node-type cache.t3.micro
```

---

## 🧪 Load Testing

```bash
# Install Apache Bench
brew install httpd  # macOS
# or apt install apache2-utils  # Linux

# Test backend
ab -n 1000 -c 100 https://api.yourdomain.com/health

# Test frontend
ab -n 1000 -c 100 https://yourdomain.com
```

---

## 📚 Documentação Útil

- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Docker Production Checklist](https://docs.docker.com/develop/dev-best-practices/)
- [Let's Encrypt Renewal](https://certbot.eff.org/docs/using.html)
- [CloudFront Caching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [Prisma Migration Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## 🎯 Performance Tuning

### Backend

```typescript
// Add caching
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Add rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### Frontend

```javascript
// next.config.js - Optimize images
const withImageOptimization = require('next/image');

module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  }
}
```

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_tasks_user ON tasks(assigned_to_id);
```

---

## ✅ Post-Deployment Validation

```bash
# 1. Check all services running
docker ps

# 2. Test API endpoints
curl https://api.yourdomain.com/health
curl -X GET https://api.yourdomain.com/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test frontend
curl -I https://yourdomain.com

# 4. Check database
docker exec nexocrm-db mysql -u root -p -e "SELECT COUNT(*) FROM clients;"

# 5. View logs for errors
docker logs nexocrm-backend | grep -i error
```

---

**Tudo checado? Parabéns, seu CRM está em produção! 🚀**
