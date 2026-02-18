# Guia de Publicação do Site na Internet

Este documento explica como publicar o site **Nogue-Convites** na internet usando diferentes plataformas de hospedagem gratuitas.

## 🚀 Opções de Hospedagem Gratuita

### 1. Vercel (Mais Recomendado) ⭐

**Vantagens:**
- Deploy instantâneo em segundos
- URLs automáticas HTTPS
- Integração perfeita com GitHub
- Deploy automático a cada commit
- Preview de pull requests
- Melhor performance

**Passo a Passo:**

#### Opção A: Via Interface Web (Mais Fácil)
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New Project"
4. Importe o repositório `marcelovn/nogue-convite`
5. Vercel detecta automaticamente as configurações (já incluídas no `vercel.json`)
6. Clique em "Deploy"
7. ✅ Pronto! Seu site estará disponível em `https://nogue-convite.vercel.app`

#### Opção B: Via CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# No diretório do projeto
cd nogue-convite

# Login
vercel login

# Deploy
vercel

# Seguir instruções na tela
```

**URL do projeto:** `https://nogue-convite.vercel.app`

---

### 2. Netlify

**Vantagens:**
- Configuração simples
- Forms gratuitos
- Functions serverless
- Deploy previews

**Passo a Passo:**

#### Via Interface Web
1. Acesse [netlify.com](https://netlify.com)
2. Faça login com GitHub
3. Clique em "Add new site" → "Import an existing project"
4. Escolha GitHub e selecione o repositório
5. Configurações de build já estão no `netlify.toml`
6. Clique em "Deploy"
7. ✅ Site disponível em `https://nogue-convite.netlify.app`

#### Via CLI
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build do projeto
npm run build

# Deploy
netlify deploy --prod --dir=dist/nogue-convites/browser
```

**URL do projeto:** `https://nogue-convite.netlify.app`

---

### 3. Firebase Hosting

**Vantagens:**
- Parte do ecossistema Google
- CDN global
- Integração com outros serviços Firebase
- SSL gratuito

**Passo a Passo:**

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Instale o Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Login no Firebase:
   ```bash
   firebase login
   ```
4. Inicialize o projeto:
   ```bash
   firebase init hosting
   ```
   - Selecione o projeto criado
   - Public directory: `dist/nogue-convites/browser`
   - Configure como SPA: **Yes**
   - Overwrite index.html: **No**
   - Set up automatic builds: **No** (opcional)

5. Build e deploy:
   ```bash
   npm run build
   firebase deploy
   ```

**URL do projeto:** `https://nogue-convite.web.app`

---

### 4. GitHub Pages

**Vantagens:**
- Gratuito para repositórios públicos
- Integração nativa com GitHub
- Workflow automático incluído

**Passo a Passo:**

#### Opção A: Via GitHub Actions (Automático)
1. Vá para o repositório no GitHub
2. Settings → Pages
3. Source: Selecione "GitHub Actions"
4. O workflow já está configurado em `.github/workflows/deploy-github-pages.yml`
5. Faça um push para a branch `main`
6. ✅ Site será publicado automaticamente

**URL do projeto:** `https://marcelovn.github.io/nogue-convite/`

#### Opção B: Via CLI Manual
```bash
# Adicionar script ao package.json (já incluído)
npm install -g angular-cli-ghpages

# Build e deploy
npm run build -- --base-href=/nogue-convite/
npx angular-cli-ghpages --dir=dist/nogue-convites/browser
```

---

## 🌐 Configurar Domínio Personalizado

Após o deploy, você pode usar seu próprio domínio:

### Vercel
1. Vá para seu projeto no Vercel
2. Settings → Domains
3. Add Domain: `www.seudominio.com.br`
4. Configure seu DNS:
   - Tipo A: `76.76.21.21`
   - CNAME www: `cname.vercel-dns.com`

### Netlify
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   - Tipo A: `75.2.60.5`
   - CNAME www: `seu-site.netlify.app`

### Firebase
1. Firebase Console → Hosting
2. Connect domain
3. Siga as instruções de verificação
4. Configure DNS conforme instruído

### GitHub Pages
1. Settings → Pages
2. Custom domain: `www.seudominio.com.br`
3. Configure DNS:
   - Tipo A: IPs do GitHub Pages
   - CNAME www: `marcelovn.github.io`

---

## 📝 Comparação Rápida

| Plataforma | Deploy | Domínio | SSL | Performance | Recomendação |
|------------|--------|---------|-----|-------------|--------------|
| **Vercel** | ⚡ Instantâneo | ✅ Sim | ✅ Auto | ⭐⭐⭐⭐⭐ | **Melhor** |
| **Netlify** | ⚡ Rápido | ✅ Sim | ✅ Auto | ⭐⭐⭐⭐ | Excelente |
| **Firebase** | 🔄 Normal | ✅ Sim | ✅ Auto | ⭐⭐⭐⭐ | Ótimo |
| **GitHub Pages** | 🔄 Normal | ✅ Sim | ✅ Auto | ⭐⭐⭐ | Bom |

---

## 🔧 Dicas Importantes

1. **Primeiro Deploy:** Recomendamos começar com **Vercel** pela facilidade
2. **Variáveis de Ambiente:** Configure no painel de cada plataforma
3. **Build Automático:** Todas as opções suportam deploy automático via Git
4. **HTTPS:** Todas as plataformas fornecem SSL/HTTPS gratuito
5. **Analytics:** Vercel e Netlify oferecem analytics básicos gratuitos

---

## 🆘 Problemas Comuns

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Teste o build localmente: `npm run build`
- Verifique os logs de build na plataforma

### Site não carrega
- Verifique se o `outputPath` está correto no `angular.json`
- Para SPAs, certifique-se que a configuração de redirect está ativa

### Erro 404 em rotas
- Configure rewrites para SPA (já incluído nos arquivos de config)
- Verifique a configuração de `base-href` se usar GitHub Pages

---

## 📱 Próximos Passos

Após publicar o site:

1. ✅ Configure analytics (Google Analytics, etc.)
2. ✅ Configure SEO (meta tags, sitemap)
3. ✅ Teste em dispositivos móveis
4. ✅ Configure domínio personalizado
5. ✅ Monitore performance
6. ✅ Configure backups

---

## 🎉 Sucesso!

Seu site estará acessível na internet! Compartilhe a URL com seus usuários.

**URLs de exemplo:**
- Vercel: `https://nogue-convite.vercel.app`
- Netlify: `https://nogue-convite.netlify.app`
- Firebase: `https://nogue-convite.web.app`
- GitHub Pages: `https://marcelovn.github.io/nogue-convite/`
