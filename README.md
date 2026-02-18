# Nogue-Convites - Interactive Invitation Cards

Plataforma SaaS para criação de convites digitais interativos e gamificados. Inspirada em card.evara.my, com foco em aumentar a taxa de confirmação de presença (RSVP) através de mecânicas divertidas.

## Recursos Principais

✨ **Editor de Cartões Personalizado**
- Nome do destinatário
- Seu nome.
- Título do cartão
- Mensagem personalizada

🎨 **Temas Visuais** (10 opções)
- Cute Bear (Gratuito).
- Sweet Hearts (Gratuito)
- Premium themes: Pink Piggy, Bold Frame, Dreamy, Vintage Tag, Love Letter, Neon Glow, Royal, Pastel Dream

🎁 **Esquemas de Cores** (12 opções)
- Classic Pink, Rose Red, Purple Love, Coral Crush, Hot Pink, Fuchsia, Violet, Ocean Blue, Emerald, Golden, True Red, Teal

🚀 **Mecânicas do Botão "Não"**
- Teleporting No: Botão foge do clique
- Growing Yes: Botão "Yes" cresce
- Multiplying Yes: Múltiplos botões "Yes"
- Shrinking No: Botão "No" encolhe

📊 **Dashboard de RSVP**
- Acompanhamento de confirmações em tempo real
- Geração de QR Code para controle de acesso
- Integração com WhatsApp para lembretes

## Estrutura do Projeto

```
src/
├── app/
│   ├── components/
│   │   ├── card-editor/          # Editor de cartões
│   │   ├── theme-selector/       # Seletor de temas
│   │   ├── color-scheme/         # Selector de cores
│   │   ├── no-button-mechanics/  # Mecânicas do botão "Não"
│   │   ├── card-preview/         # Visualização do cartão
│   │   └── rsvp-dashboard/       # Painel de RSVP
│   ├── services/
│   │   ├── card.ts               # Gerenciamento de cartões
│   │   ├── theme.ts              # Gerenciamento de temas
│   │   └── rsvp.ts               # Gerenciamento de RSVP
│   └── app.ts                    # Componente raiz
└── styles.scss                   # Estilos globais
```

## Desenvolvimento

### Requisitos
- Node.js v20+
- Angular CLI 19+

### Instalação

```bash
npm install
```

### Iniciar servidor de desenvolvimento

```bash
ng serve
```

Acesse `http://localhost:4200/` no navegador. A aplicação recarrega automaticamente ao modificar os arquivos.

### Build de produção

```bash
ng build --configuration production
```

Os artefatos serão gerados no diretório `dist/`.

## Publicar na Internet

Este projeto está configurado para deploy fácil em várias plataformas de hospedagem gratuitas.

### Opção 1: Vercel (Recomendado) ⭐

1. Crie uma conta gratuita em [vercel.com](https://vercel.com)
2. Instale o Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Faça o deploy:
   ```bash
   vercel
   ```
4. Siga as instruções na tela
5. Seu site estará disponível em uma URL como: `https://seu-projeto.vercel.app`

**Deploy via GitHub (Recomendado):**
- Conecte seu repositório GitHub ao Vercel
- Cada push para a branch principal fará deploy automático
- URL personalizada gratuita: `seu-projeto.vercel.app`

### Opção 2: Netlify

1. Crie uma conta gratuita em [netlify.com](https://netlify.com)
2. Conecte seu repositório GitHub
3. Configurações de build já estão no arquivo `netlify.toml`
4. Deploy automático em cada push
5. URL disponível em: `https://seu-projeto.netlify.app`

**Deploy manual via CLI:**
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist/nogue-convites/browser
```

### Opção 3: Firebase Hosting

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Instale o Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Configure o Firebase:
   ```bash
   firebase login
   firebase init hosting
   ```
4. Selecione `dist/nogue-convites/browser` como diretório público
5. Configure como SPA (sim para rewrite)
6. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```
7. URL disponível em: `https://seu-projeto.web.app`

### Opção 4: GitHub Pages

1. Adicione o script de deploy ao `package.json`:
   ```json
   "deploy": "ng build --configuration production --base-href=/nogue-convite/ && npx angular-cli-ghpages --dir=dist/nogue-convites/browser"
   ```
2. Execute:
   ```bash
   npm run deploy
   ```
3. URL disponível em: `https://seu-usuario.github.io/nogue-convite/`

### Configurar Domínio Personalizado

Após o deploy em qualquer plataforma, você pode configurar um domínio personalizado:

**Vercel:**
- Settings → Domains → Add Domain
- Configure DNS apontando para Vercel

**Netlify:**
- Domain Settings → Add Custom Domain
- Configure DNS ou use Netlify DNS

**Firebase:**
- Hosting → Connect Domain
- Siga as instruções de configuração DNS

### URL do Projeto

Após o deploy, sua URL será algo como:
- Vercel: `https://nogue-convites.vercel.app`
- Netlify: `https://nogue-convites.netlify.app`
- Firebase: `https://nogue-convites.web.app`
- GitHub Pages: `https://marcelovn.github.io/nogue-convite/`

## Modelo de Negócio

- **Freemium**: Cadastro gratuito com temas básicos
- **Premium**: Acesso a 8 temas premium com badge "PRO"
- **B2B**: Assinatura mensal para salões de festas
- **B2C**: Venda individual de convites premium

## Tecnologias

- Angular 19+
- TypeScript
- SCSS
- RxJS

## Licença

MIT
