# 🔑 Criar Usuário IAM na AWS para CI/CD (GitHub Actions)

## 📋 O que você vai fazer

Criar um usuário IAM (Identity and Access Management) que o GitHub Actions vai usar para fazer deploy na AWS. Esse usuário terá **permissões mínimas** apenas do que precisa.

---

## ✅ PASSO 1: Acessar IAM Console

1. Abra [AWS Console](https://console.aws.amazon.com/)
2. Na barra de pesquisa, digite **IAM**
3. Clique em **IAM**
4. No menu esquerdo, clique em **Users**
5. Clique em **Create user**

---

## ✅ PASSO 2: Nombrar o Usuário

**User name:** `github-actions-nexocrm` (ou seu nome preferido)

*Descontinuar "Provide user access to the AWS Management Console" - não precisa de console.*

Clique em **Next**

---

## ✅ PASSO 3: Adicionar Permissões (Opção A - Manual)

### Opção A: Permissões Mínimas (Recomendado)

1. Selecione: **Attach policies directly**
2. Na caixa de busca, procure por estas políticas e **marque cada uma:**

   **Para ECR (Docker Registry):**
   - [ ] `AmazonEC2ContainerRegistryPowerUser`
   
   **Para EC2 (Deploy):**
   - [ ] `AmazonEC2FullAccess` (ou `AmazonEC2ContainerServiceRoleForEC2` se quiser mais restrito)
   
   **Para RDS (Database):**
   - [ ] `AmazonRDSFullAccess` (ou `AmazonRDSReadOnlyAccess` se só quiser ler)
   
   **Para S3 (Frontend):**
   - [ ] `AmazonS3FullAccess`
   
   **Para CloudFront (CDN):**
   - [ ] `CloudFrontFullAccess`

3. Clique em **Next**

### Opção B: Política Personalizada (Ultra-Restritiva)

Se quer máxima segurança, passa essa policy JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPush",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:YOUR_ACCOUNT_ID:repository/nexocrm-*"
    },
    {
      "Sid": "EC2Deploy",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3Frontend",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nexocrm-frontend",
        "arn:aws:s3:::nexocrm-frontend/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

**Instruções para adicionar policy personalizada:**
1. Em vez de "Attach policies directly", escolha "Create and attach an inline policy"
2. Cole o JSON acima (substituindo `YOUR_ACCOUNT_ID` - veja abaixo como encontrar)
3. Clique em **Next**

---

## ✅ PASSO 4: Revisar e Criar

1. Revise o nome e permissões
2. Clique em **Create user**
3. ✅ Usuário criado!

---

## ✅ PASSO 5: Gerar Access Keys

Você vai ver uma tela com o usuário criado. Clique na aba **Security credentials**

Procure por **Access keys** e clique em **Create access key**

**Use case:** Escolha **Other**

Clique em **Next**

Na próxima tela, você vai ver 2 valores:
- 📋 **Access Key ID** (tipo: AKIA2K7EXAMPL5TQXZ2)
- 📋 **Secret Access Key** (tipo: wJalrXUtnFEMI/K7MDENG+39LASJ29DLEX2PLMEA)

**⚠️ IMPORTANTE: Copie os dois valores agora!**

A AWS só mostra a secret access key uma única vez. Se perder, precisa criar outra chave.

Eu recomendo:
1. Abra um arquivo de texto local (.txt)
2. Cole ambos os valores
3. Guarde em local seguro
4. Depois deleta o arquivo

---

## ✅ PASSO 6: Encontrar Seu AWS Account ID

Você precisa do Account ID para a política personalizada (se usou).

1. [Clique aqui para Account ID](https://console.aws.amazon.com/console/home?#/account-settings) ou:
2. AWS Console > canto superior direito > clique no seu nome de usuário > **Account ID**
3. Copie um número tipo: `123456789012`

---

## ✅ PASSO 7: Adicionar os Secrets no GitHub

**Agora você tem:**
- AWS_ACCESS_KEY_ID (do passo 5)
- AWS_SECRET_ACCESS_KEY (do passo 5)
- AWS_REGION = `us-east-1` (ou sua região)
- RDS_MASTER_PASSWORD (a senha que você criou no RDS)

**No GitHub:**

1. Vá ao repositório **nexocrm**
2. Clique em **Settings** (direita)
3. Clique em **Secrets and variables** (esquerda)
4. Clique em **Actions**
5. Clique em **New repository secret**

Para cada secret, crie assim:

### Secret 1: AWS_ACCESS_KEY_ID
- **Name:** `AWS_ACCESS_KEY_ID`
- **Secret:** (Cole o Access Key ID do passo 5)
- Clique em **Add secret**

### Secret 2: AWS_SECRET_ACCESS_KEY
- **Name:** `AWS_SECRET_ACCESS_KEY`
- **Secret:** (Cole o Secret Access Key do passo 5)
- Clique em **Add secret**

### Secret 3: AWS_ACCOUNT_ID
- **Name:** `AWS_ACCOUNT_ID`
- **Secret:** (Cole seu Account ID do passo 6)
- Clique em **Add secret**

### Secret 4: AWS_REGION
- **Name:** `AWS_REGION`
- **Secret:** `us-east-1`
- Clique em **Add secret**

### Secret 5: RDS_MASTER_PASSWORD
- **Name:** `RDS_MASTER_PASSWORD`
- **Secret:** (A senha que você criou quando fizemos RDS)
- Clique em **Add secret**

---

## ✅ PASSO 8: Verificar Se Funcionou

Depois que criar o RDS e EC2, faça um teste:

1. No GitHub, vá em **Actions**
2. Faça um commit pequeno: `git commit --allow-empty -m "Test CI/CD"` e `git push`
3. Veja se o workflow `Deploy to AWS` rodou
4. Ele deveria fazer build das imagens Docker

---

## 🆘 Troubleshooting

### "Access Denied" no GitHub Actions

**Solução:**
1. Volta ao IAM > Users > seu usuário
2. Clique em **Add permissions** > **Attach policies directly**
3. Adicione as políticas que faltam

### "Cannot assume role"

**Solução:** Se usou OIDC (não é seu caso), skip isso.

### Secret não tá sendo reconhecido

**Solução:**
1. Verifica o nome do secret exatamente como está no `.github/workflows/deploy.yml`
2. Exemplo: `${{ secrets.AWS_ACCESS_KEY_ID }}` (case sensitive!)

---

## 📝 Quick Checklist

- [ ] Entrei em AWS IAM Console
- [ ] Criei um novo usuário chamado `github-actions-nexocrm`
- [ ] Adicionei permissões (ECR, EC2, S3, CloudFront)
- [ ] Gerei Access Key ID e Secret Access Key
- [ ] Copiei os valores em local seguro
- [ ] Encontrei meu AWS Account ID
- [ ] Adicionei 5 secrets no GitHub
- [ ] Fiz um commit de teste
- [ ] GitHub Actions rodou com sucesso

---

## 🎯 Próximo Passo

Agora você tem:
1. ✅ Usuário IAM criado
2. ✅ Permissões configuradas
3. ✅ Access Keys geradas
4. ✅ Secrets no GitHub

Próximo: Criar RDS MySQL e EC2 na AWS (siga o [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md) Phase 2).

---

**Sucesso! 🚀**
