# ⚙️ Configurar RDS MySQL - Settings (Settings da Tela)

## 📋 Campos que você precisa preencher

### 1. DB Instance Identifier
**Campo:** DB instance identifier

**Valor:** `nexocrm-prod`

*Esse é o nome do seu banco de dados na AWS.*

---

### 2. Master Username
**Campo:** Master username

**Valor:** `admin`

*Esse é o usuário root do MySQL.*

---

### 3. Master Password
**Campo:** Master password

**Valor:** Crie uma senha **forte** (mínimo 8 caracteres, letras + números + símbolos)

**Exemplo:** `MySecure@Pass123!`

**⚠️ IMPORTANTE:** Copie essa senha e guarde em local seguro! Você vai usar como `RDS_MASTER_PASSWORD` no GitHub Secrets.

---

### 4. Storage Type
**Campo:** Storage type

**Selecione:** `gp3` (General Purpose SSD)

---

### 5. Allocated Storage
**Campo:** Allocated storage

**Valor:** `20` GB

*Mínimo pra começar. AWS permite autoscaling depois.*

---

### 6. Storage Autoscaling
**Campo:** Enable storage autoscaling

**Marcar:** ✅ Sim

**Maximum storage threshold:** `100` GB

*Isso deixa a AWS aumentar automaticamente quando o espaço acabar.*

---

### 7. Connectivity - VPC
**Campo:** Virtual private cloud (VPC)

**Selecione:** `default`

*Se tiver múltiplos VPCs, escolha aonde sua aplicação está.*

---

### 8. Public Accessibility
**Campo:** Public accessibility

**Selecione:** Não ❌

*Importante! O RDS NÃO deve ser acessível da internet. Apenas do EC2.*

---

### 9. Backup Retention
**Campo:** Retention period

**Valor:** `7` dias

*AWS vai manter backups automáticos por 7 dias.*

---

### 10. Backup Window
**Campo:** Preferred backup window

**Selecione:** `03:00 - 04:00 (UTC)`

*Escolha um horário que sua aplicação tem menos tráfego.*

---

### 11. Monitoring
**Campo:** Enable Enhanced monitoring

**Marcar:** ✅ Sim (opcional, mas recomendado)

**Monitoring Resolution:** `60 seconds`

---

### 12. Performance Insights
**Campo:** Enable Performance Insights

**Marcar:** ❌ Não (pra economizar)

---

### 13. Additional Configuration (Expandir)

**Initial database name:**
```
nexocrm
```

**DB parameter group:**
Deixa o default

**DB option group:**
Deixa o default

**Enable automated minor version upgrade:**
Deixa ✅ Marcado

**Enable deletion protection:**
❌ Desmarque (pra poder deletar depois se precisar)

---

## ✅ Resumo Quick

| Campo | Valor |
|-------|-------|
| **Identifier** | `nexocrm-prod` |
| **Master Username** | `admin` |
| **Master Password** | `jucvoc-buhmyp-4Mabji` |
| **Storage Type** | `gp3` |
| **Storage Size** | `20 GB` |
| **Autoscaling** | ✅ Sim (até 100GB) |
| **VPC** | `default` |
| **Public Accessible** | ❌ Não |
| **Backup Retention** | `7 dias` |
| **Database Name** | `nexocrm` |

---

## 🎯 Próximos Passos

Depois de preencher tudo e clicar em **Create database**:

1. **Aguarde 5-10 minutos** (o RDS está sendo criado)
2. **Copie o Endpoint** quando ficar "Available" (tipo: `nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com`)
3. **Salve no `.env.production`:**
   ```env
   DATABASE_URL=mysql://admin:SUA_SENHA@nexocrm-prod.c9akciq32.us-east-1.rds.amazonaws.com:3306/nexocrm
   RDS_MASTER_PASSWORD=SUA_SENHA
   ```

4. **Depois crie o EC2** e configure security groups pra conectar ao RDS

---

**Tá bom? Clica em "Create database" quando terminar de preencher! 🚀**
