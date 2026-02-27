# Nogue Convites

Plataforma para criação e envio de convites digitais interativos com RSVP gamificado. Os convidados recebem um link personalizado e confirmam presença em uma experiência animada — onde o botão "Não" literalmente foge do clique.

## Funcionalidades

### Criação de convites
- Texto personalizado: nome do remetente, título e mensagem
- 5 temas visuais com fontes e paletas próprias:
  - Elegante Minimalista (Poppins)
  - Romântico Radiante (Lora)
  - Festa Colorida (Fredoka One)
  - Luxo Dourado (Playfair Display)
  - Oceano Tranquilo (Quicksand)
- 5 esquemas de cores: Azul Clássico, Roxo Amor, Coral Intenso, Esmeralda, Vermelho Verdadeiro
- Emojis flutuantes animados (confete, flor, coração, estrela, borboleta)

### Mecânicas do botão "Não"
Ao abrir o convite, o convidado se depara com um botão "Sim" e um "Não" com comportamento especial:
- **Não Foge** — o botão "Não" desaparece ao passar o mouse
- **Sim Cresce** — o botão "Sim" vai aumentando de tamanho
- **Sim Multiplica** — vários botões "Sim" aparecem na tela
- **Não Encolhe** — o botão "Não" fica progressivamente menor

### Modo Desafio
O remetente pode ativar um mini-game que o convidado deve resolver antes de confirmar presença:
- Conta Rápida (soma simples)
- Contagem de Emoji
- Palavra Embaralhada
- Memória Numérica
- Maior Número
- Verdadeiro ou Falso

### Gerenciamento de convidados
- Adicione convidados individualmente (nome + telefone)
- Importação em massa via texto no formato `Nome, Telefone` (uma linha por convidado)
- Cada convidado recebe um token único — o link de convite é personalizado e rastreável
- Envio pelo WhatsApp direto da plataforma (abre o app com mensagem pronta)
- Rastreamento de status por convidado: Aguardando → Enviado → Visualizado → Confirmado / Recusou

### Dashboard de RSVP
- Lista todos os convites criados
- Estatísticas por convite: total de respostas, confirmados, recusados e taxa de aceitação
- Preview rápido da lista de convidados
- Copiar link único (com token) ou compartilhar pelo WhatsApp
- Limpar respostas ou excluir convite

## Tecnologias

- **Angular 21** com Signals e `ChangeDetectionStrategy.OnPush`
- **Supabase** — banco de dados e autenticação
- **TypeScript 5.9**
- **SCSS**
- **RxJS**

## Estrutura do projeto

```
src/
├── app/
│   ├── components/
│   │   ├── auth/               # Login e cadastro
│   │   ├── card-editor/        # Criação de novo convite
│   │   ├── invite-manager/     # Edição de convite existente + preview ao vivo
│   │   ├── card-preview/       # Visualização do convite (rota pública)
│   │   ├── theme-selector/     # Seletor de temas
│   │   ├── color-scheme/       # Seletor de esquema de cores
│   │   ├── no-button-mechanics/# Configuração da mecânica do botão
│   │   ├── guests-manager/     # Lista e envio para convidados
│   │   ├── rsvp-dashboard/     # Painel principal do usuário
│   │   └── confirm-dialog/     # Dialog de confirmação reutilizável
│   ├── guards/
│   │   └── auth.guard.ts       # Proteção de rotas autenticadas
│   ├── models/
│   │   ├── card.model.ts       # Interfaces: Card, RSVPEntry, InviteToken etc.
│   │   ├── guest.model.ts      # Interface Guest e GuestStats
│   │   └── constants.ts        # Temas, cores e mecânicas disponíveis
│   ├── services/
│   │   ├── auth.ts             # Autenticação via Supabase
│   │   ├── card.ts             # CRUD de convites
│   │   ├── guest.service.ts    # CRUD de convidados + envio WhatsApp
│   │   ├── invite-token.ts     # Geração e validação de tokens únicos
│   │   ├── rsvp.ts             # Registro e consulta de respostas
│   │   ├── supabase.ts         # Cliente Supabase
│   │   └── theme.ts            # Estado dos temas selecionados
│   └── app.routes.ts           # Definição de rotas
└── environments/
    └── environment.ts          # URL e chave do Supabase
```

## Rotas

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Login |
| `/register` | Público | Cadastro |
| `/editor` | Autenticado | Criar novo convite |
| `/manage/:id` | Autenticado | Editar convite existente |
| `/dashboard` | Autenticado | Painel com todos os convites |
| `/invite/:id` | Público | Visualizar convite |
| `/invite/:id/:token` | Público | Visualizar convite com token de convidado |

## Configuração

### Requisitos
- Node.js v20+
- Angular CLI 21+
- Projeto Supabase com as tabelas: `users`, `cards`, `guests`, `rsvp_entries`, `invite_tokens`

### Instalação

```bash
npm install
```

Configure as variáveis do Supabase em `src/environments/environment.ts`:

```ts
export const environment = {
  supabase: {
    url: 'https://SEU_PROJETO.supabase.co',
    key: 'SUA_ANON_KEY'
  }
};
```

### Servidor de desenvolvimento

```bash
ng serve
```

Acesse `http://localhost:4200/`.

### Build de produção

```bash
ng build --configuration production
```

Os artefatos serão gerados em `dist/`.

## Licença

MIT
