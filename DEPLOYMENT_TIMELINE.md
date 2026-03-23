# 📅 Deployment Timeline & Architecture Diagram

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    END USERS / CLIENTS                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTPS (TLS/SSL)
                             │
         ┌───────────────────┴───────────────────┐
         │                                        │
         ▼                                        ▼
    ┌─────────┐                          ┌──────────────┐
    │ CloudFront                         │  Route 53    │
    │ (CDN for Static)                   │  (DNS)       │
    └──────┬──────┘                      └──────┬───────┘
           │                                     │
           │ https://yourdomain.com             │
           │                                     │ api.yourdomain.com
           ▼                                     ▼
    ┌─────────────────┐              ┌──────────────────┐
    │  S3 Bucket      │              │   EC2 Instance   │
    │  (frontend)     │              │  (docker host)   │
    └────────────────┘              └────────┬─────────┘
                                             │
                          ┌──────────────────┴──────────────────┐
                          │                                     │
                          ▼                                     ▼
                  ┌─────────────────┐            ┌────────────────────┐
                  │  Backend Cont.  │            │ Frontend Container │
                  │  Port 3001      │            │ Port 3000          │
                  │  (Node/Express) │            │ (Next.js)          │
                  └────────┬────────┘            └────────────────────┘
                           │
                           │ DATABASE_URL
                           │ (private subnet)
                           ▼
                  ┌──────────────────────┐
                  │   RDS MySQL          │
                  │   Port 3306          │
                  │   (managed)          │
                  └──────────────────────┘
```

---

## ⏱️ Deployment Timeline

### Phase 1: Preparation (1-2 hours)

```
┌─────────────────────────────────────────┐
│ 1. Create GitHub Repository             │ ~10 min
├─────────────────────────────────────────┤
│ 2. Create AWS Account (if new)          │ ~15 min
├─────────────────────────────────────────┤
│ 3. Create RDS MySQL Instance            │ ~20 min
│    (includes 5-10 min for instance to start)
├─────────────────────────────────────────┤
│ 4. Create EC2 Instance                  │ ~10 min
├─────────────────────────────────────────┤
│ 5. Create S3 + CloudFront               │ ~15 min
├─────────────────────────────────────────┤
│ 6. Create ECR Repositories              │ ~5 min
└─────────────────────────────────────────┘
                Total: ~75 minutes
```

### Phase 2: Setup AWS Infrastructure (30 min)

```
┌──────────────────────────────┐
│ 1. Configure Security Groups │ ~10 min
├──────────────────────────────┤
│ 2. Create IAM User for CI/CD │ ~10 min
├──────────────────────────────┤
│ 3. Get RDS Endpoint          │ ~2 min
├──────────────────────────────┤
│ 4. Get EC2 IP Address        │ ~2 min
└──────────────────────────────┘
            Total: ~24 minutes
```

### Phase 3: Local Deployment (45 min)

```
┌────────────────────────────────────────────┐
│ 1. Prepare .env.production                 │ ~5 min
├────────────────────────────────────────────┤
│ 2. SSH into EC2                            │ ~2 min
├────────────────────────────────────────────┤
│ 3. Install Docker on EC2                   │ ~5 min
├────────────────────────────────────────────┤
│ 4. Clone Repository                        │ ~2 min
├────────────────────────────────────────────┤
│ 5. Build Docker Images                     │ ~15 min
├────────────────────────────────────────────┤
│ 6. Run Database Migrations                 │ ~5 min
├────────────────────────────────────────────┤
│ 7. Start Services                          │ ~3 min
├────────────────────────────────────────────┤
│ 8. Test Health Endpoints                   │ ~2 min
└────────────────────────────────────────────┘
             Total: ~39 minutes
```

### Phase 4: Domain & SSL (30-60 min)

```
┌──────────────────────────────┐
│ 1. Register Domain           │ ~15 min
│    (or use existing)         │
├──────────────────────────────┤
│ 2. Configure Route 53 DNS    │ ~10 min
│    (wait for propagation)    │
├──────────────────────────────┤
│ 3. Generate SSL Certificate  │ ~10 min
│    (Let's Encrypt)           │
├──────────────────────────────┤
│ 4. Test HTTPS Connection     │ ~5 min
└──────────────────────────────┘
    Total: ~40 minutes (+ DNS propagation)
```

### Phase 5: CI/CD Setup (20 min)

```
┌───────────────────────────────┐
│ 1. Add GitHub Secrets         │ ~5 min
├───────────────────────────────┤
│ 2. Test GitHub Actions        │ ~10 min
│    (watch first deployment)   │
├───────────────────────────────┤
│ 3. Verify Auto-Deploy Works   │ ~5 min
└───────────────────────────────┘
           Total: ~20 minutes
```

---

## 📋 Complete Checklist by Phase

### ✅ Phase 1: GitHub & Local Prep
- [ ] Create GitHub repository
- [ ] Initialize Git locally
- [ ] Commit code
- [ ] Push to main branch
- [ ] Create `.env.production` file

### ✅ Phase 2: AWS Infrastructure
- [ ] Create AWS account (if needed)
- [ ] Create RDS MySQL instance (wait for "Available" status)
- [ ] Copy RDS endpoint
- [ ] Create EC2 instance
- [ ] Get EC2 IP address
- [ ] Create S3 bucket for frontend
- [ ] Create CloudFront distribution
- [ ] Create ECR repositories (backend, frontend)

### ✅ Phase 3: Security & Access
- [ ] Configure EC2/RDS security groups
- [ ] Add EC2 security group to RDS inbound rules
- [ ] Generate key pair and store safely
- [ ] Create IAM user for CI/CD
- [ ] Generate AWS access keys for CI/CD
- [ ] Test EC2 SSH access

### ✅ Phase 4: Backend Deployment
- [ ] SSH into EC2
- [ ] Install Docker and Docker Compose
- [ ] Clone repository
- [ ] Copy `.env.production`
- [ ] Build backend Docker image
- [ ] Push to ECR (optional)
- [ ] Run database migrations
- [ ] Start backend container
- [ ] Test health endpoint: `curl http://localhost:3001/health`

### ✅ Phase 5: Frontend Deployment
- [ ] Build frontend Docker image
- [ ] Push to ECR (optional)
- [ ] Start frontend container
- [ ] Test frontend: `curl http://localhost:3000`
- [ ] Upload to S3 (if not using Docker)
- [ ] Invalidate CloudFront cache

### ✅ Phase 6: Domain & HTTPS
- [ ] Register domain (if new)
- [ ] Add Route 53 hosted zone
- [ ] Update nameservers
- [ ] Create A record for frontend (CloudFront)
- [ ] Create A record for API (EC2)
- [ ] Install Let's Encrypt certificate
- [ ] Configure auto-renewal
- [ ] Test HTTPS: `curl https://api.yourdomain.com/health`

### ✅ Phase 7: CI/CD Automation
- [ ] Add AWS secrets to GitHub
- [ ] Test GitHub Actions workflow
- [ ] Verify ECR image push
- [ ] Verify EC2 auto-deployment (optional)
- [ ] Test full CI/CD pipeline with a push

### ✅ Phase 8: Monitoring & Validation
- [ ] Test login flow in production
- [ ] Test all API endpoints
- [ ] Monitor logs for errors
- [ ] Setup CloudWatch alarms (optional)
- [ ] Document deployment notes
- [ ] Create runbook for common issues

---

## 🎯 Quick Action Items

### Day 1: Setup (2-3 hours)
```bash
# 1. Create GitHub repo and push code
git push

# 2. Create AWS infrastructure (via console) - 30 min
# 3. SSH into EC2 and prep environment
ssh -i key.pem ubuntu@EC2_IP
# 4. Deploy backend
docker build -t nexocrm-backend ./backend
# 5. Deploy frontend
docker build -t nexocrm-frontend ./frontend
# 6. Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Day 2: Domain & Validation (1-2 hours)
```bash
# 1. Register domain
# 2. Configure Route 53
# 3. Generate SSL certificate
sudo certbot certonly --standalone -d api.yourdomain.com
# 4. Test endpoints
curl https://api.yourdomain.com/health
# 5. Access application
# https://yourdomain.com
```

### Day 3: CI/CD & Monitoring (1 hour)
```bash
# 1. Add GitHub secrets
# 2. Test CI/CD pipeline
git commit --allow-empty -m "Test CI/CD"
git push
# 3. Verify deployment
docker logs -f nexocrm-backend
# 4. Monitor performance
docker stats
```

---

## 📈 Post-Launch Improvements

After getting everything deployed, consider:

1. **Security Hardening** (Week 1)
   - Enable SSL/TLS certificate auto-renewal
   - Setup AWS WAF for CloudFront
   - Enable VPC flow logs
   - Review and restrict IAM permissions

2. **Monitoring & Alerts** (Week 1)
   - Setup CloudWatch dashboards
   - Create alarms for CPU/Memory
   - Setup SNS email notifications
   - Configure application logging

3. **Performance Optimization** (Week 2)
   - Add Redis caching layer
   - Optimize database indexes
   - Configure CDN caching policies
   - Enable GZIP compression

4. **Backup & Disaster Recovery** (Week 2)
   - Test RDS automated backups
   - Create disaster recovery procedure
   - Document rollback process
   - Setup cross-region backup (optional)

5. **Scaling Preparation** (Week 3)
   - Create EC2 AMI for auto-scaling
   - Setup Application Load Balancer
   - Configure RDS read replicas
   - Document horizontal scaling procedure

---

## 💰 Cost Estimation

| Service | Size | Monthly Cost |
|---------|------|--------------|
| EC2 | t3.micro | ~$9 |
| RDS MySQL | db.t3.micro | ~$15 |
| S3 + CloudFront | Variable | ~$5-20 |
| NAT Gateway | (if needed) | ~$32 |
| **Total** | | **~$26-76** |

*Free tier eligible if AWS account is new (12 months)*

---

## 🆘 Need Help?

If you get stuck during any phase:

1. **Check logs first:**
   ```bash
   docker logs nexocrm-backend
   docker logs nexocrm-frontend
   aws rds describe-db-instances --db-instance-identifier nexocrm-prod
   ```

2. **Common issues:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

3. **AWS Docs:**
   - [RDS Getting Started](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStartedWithRDS.html)
   - [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
   - [CloudFront Guide](https://docs.aws.amazon.com/cloudfront/)

---

**Good luck! You've got this! 🚀**
