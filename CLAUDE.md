# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200
npm run build      # Production build
npm test           # Run tests (vitest)
```

No linting script is configured — formatting uses Prettier (config in `package.json`): single quotes, 100-char print width, Angular HTML parser for templates.

## Architecture

**Stack:** Angular 21 standalone components · Supabase (PostgreSQL + Auth) · TypeScript 5.9

**Backend:** All data lives in Supabase. No dedicated API server — services call `supabase.getClient()` directly. Credentials are in `src/environments/environment.ts`. The Supabase schema includes tables: `cards`, `events`, `event_categories`, `event_expenses`, `guests`, `rsvp_entries`, `invite_tokens`, `profiles`.

### Core data model

- **AppEvent** — the top-level entity (name, date, location, budget). Lives in `event.model.ts`.
- **Card** — a digital invite linked to an event via `eventId`. Has theme, colorScheme, noButtonMechanic, optional music/photo/game. Lives in `card.model.ts`.
- **Guest** — a pre-added attendee with a unique `token` for their personal invite link. Status flow: `pending → sent → viewed → confirmed | declined`. Lives in `guest.model.ts`.
- **RSVPEntry** — anonymous confirmation via a shared invite link (not tied to a pre-added guest). Stored in `rsvp_entries` table.
- **EventCategory** — custom checklist section for an event. Items are stored as JSON (`[{text, done}]`) in the `notes` field, with plain-newline fallback for legacy data.
- **NoteItem** — `{ text: string; done: boolean }` — item inside an EventCategory.

### Two RSVP pathways

1. **Guest-based:** organizer pre-adds guests via GuestsManager → each guest gets a personal URL `/invite/:cardId/:guestToken` → confirmation updates `guests` table → tracked in `GuestService.guestsSignal`.
2. **Link-based:** organizer shares a generic URL `/invite/:cardId/:inviteToken` → confirmation updates `rsvp_entries` table → tracked in `RsvpService.rsvpEntries`.

Stats in `EventDetailComponent` combine both sources (see `guestStats` computed signal).

### State management pattern

All state uses Angular Signals (`signal()`, `computed()`). Services are singleton (`providedIn: 'root'`) and expose signals for reactive consumption in templates. `CardService` still uses an RxJS `BehaviorSubject` (`cards$`) for the card list alongside signals — the rest of the codebase is signal-only.

`AuthService.authReady` is a Promise that resolves once the initial Supabase session check completes. `authGuard` awaits it before checking `isAuthenticated()`.

### Routing

| Path | Component | Guard |
|---|---|---|
| `/` | WelcomeComponent | — |
| `/login` | LoginComponent | — |
| `/register` | RegisterComponent | — |
| `/dashboard` | RsvpDashboard | authGuard |
| `/events/new` | EventFormComponent | authGuard |
| `/events/:eventId` | EventDetailComponent | authGuard |
| `/events/:eventId/edit` | EventFormComponent | authGuard |
| `/events/:eventId/editor` | CardEditor | authGuard |
| `/manage/:id` | InviteManager | authGuard |
| `/invite/:id/:token` | CardPreview | — |
| `/invite/:id` | CardPreview | — |

### Key components

- **EventDetailComponent** — central admin screen for a single event. Accordion layout: Convite → Convidados → Gastos → custom sections. Injects GuestService + RsvpService and reloads both on init.
- **CardPreview** — public invite view. Handles both guest tokens (looks up guest, updates `guests` table) and invite tokens (looks up via InviteTokenService, updates `rsvp_entries`). Also used for preview in the editor.
- **CardEditor / InviteManager** — invite design editors that share ThemeService for real-time preview.
- **RsvpDashboard** — lists all events belonging to the authenticated user.

### CSS conventions

Global design tokens are CSS variables defined in `src/styles.scss` (`--primary`, `--accent`, `--border`, `--radius`, etc.). Global utility classes: `.btn`, `.btn-primary`, `.btn-ghost`, `.card-base`, `.animate-fade-in`, `.skeleton*`. Component styles are scoped SCSS files. The Login/Register/Welcome pages share a minified single-line SCSS base for the animated card background.
