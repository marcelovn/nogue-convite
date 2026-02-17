# Nogue-Convites - Interactive Invitation Cards

Plataforma SaaS para criação de convites digitais interativos e gamificados. Inspirada em card.evara.my, com foco em aumentar a taxa de confirmação de presença (RSVP) através de mecânicas divertidas.

## Recursos Principais

✨ **Editor de Cartões Personalizado**
- Nome do destinatário
- Seu nome.
- Título do cartão
- Mensagem personalizada

🎨 **Temas Visuais** (10 opções)
- Cute Bear (Gratuito)
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
