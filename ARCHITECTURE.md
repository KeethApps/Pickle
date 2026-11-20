# Pickle: Architecture (v0.3)

Share any link or reel to Pickle. It waits in an inbox until you sort it into a collection. Later you search, filter, turn any card into a reminder or task, and open the links you extracted from it, on your phone or your laptop.

This file is written for Claude Code. Read it fully before generating code. Anything marked **VERIFY** was not confirmed against current docs: check versions and APIs before relying on it.

Design source: the Figma/canvas "Pickle: refined screens, workflows and cards". Where this file and the screens disagree, this file wins and the screens get updated.

---

## 0. Decisions at a glance

| # | Decision | Status |
|---|----------|--------|
| D1 | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) is the source of truth. **Replaces v0.1's local-first SQLite** | Decided |
| D2 | Phone app: Expo (React Native, TypeScript), Android first. The share sheet needs native code, so a pure web app is not enough | Decided |
| D3 | Laptop app: web build from the same codebase (Expo Router web) for v1. Revisit a separate Vite app only if keyboard UX suffers | Recommended |
| D4 | Phone keeps a small local cache and an outbox queue, so saving a link works offline and syncs later | Decided |
| D5 | Collections define fields, statuses and card slots. Cards, forms and filters render from that definition. No per-collection screens | Decided |
| D6 | Only Title is required on any item | Decided |
| D7 | Every collection owns an editable status list. Behavior follows each status `kind` (open, active, done), never its label | Decided |
| D8 | Any item can have reminders and tasks (a task is a reminder that may have no date) | Decided |
| D9 | Core link plus any number of **extra links** per item | Decided |
| D10 | Enrichment fetches only title and cover. No GitHub stars, languages or other extras | Decided |
| D11 | Reminders are delivered by server push (phone and laptop) plus a local notification on the phone as an offline fallback | Recommended, VERIFY |
| D12 | In-app map view is later. v1 maps = "Open in Maps" | Decided |
| D13 | Two repos: a public **frontend** repo (app, web, shared `core`) and a private **backend** repo (Supabase migrations, Edge Functions). Built-in collection definitions live only in the frontend repo and are **seeded into each user's `collections` rows by the app**, so the backend never needs a copy | Decided |
| D15 | Cards can be created by hand: pick a collection first, then fill the details. Only the name is required, a link is optional, and the card goes straight into the collection (stage `sorted`), never the Inbox | Decided |
| D14 | The reminder bell sits in the top bar of every detail screen next to the three-dot menu. The bottom bar holds the main action and one mark-done button | Decided |

Privacy statement (honest version): saving needs an account because data lives in your Supabase project. Link previews send the shared URL to the site being previewed through your Edge Function. Previews can be switched off in Settings.

---

## 1. Principles

1. **Inbox is sacred.** Saving takes under a second and never waits on the network. If offline, the link goes into the outbox and syncs later.
2. **Structure beats text.** A field exists only if it is filterable, useful on the card, or needed on the detail screen.
3. **Schema-driven UI.** A new or custom collection needs zero new screens.
4. **Pure logic lives in `packages/core`**, no React, no Expo, no Supabase client. Unit-tested, shared by phone, web and Edge Functions.
5. **Soft delete everywhere** (`deleted_at`). It powers Undo, Trash and sync tombstones.
6. **Field IDs never change.** Labels can be renamed. Deleting a field keeps its data.

---

## 2. Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Phone and web app | Expo, Expo Router, TypeScript | One codebase for Android, iOS later, and web |
| Share target | `expo-share-intent` config plugin | Pickle appears in the Android share sheet. Needs a dev build, not Expo Go. **VERIFY** SDK support |
| Backend | Supabase: Postgres, Auth (magic link), Storage, Realtime, Edge Functions, pg_cron | Single backend, row level security |
| Data fetching | TanStack Query with a persisted cache | Offline reads, optimistic writes |
| Outbox | Small queue persisted with `expo-sqlite` or MMKV, replayed on reconnect | Offline saves. **VERIFY** which store |
| Realtime | Supabase Realtime on `items`, `reminders`, `collections` | Laptop sees phone saves in seconds |
| Search | Postgres full-text search (`tsvector`, GIN) plus `jsonb` filters | Replaces SQLite FTS5 and the facets table |
| Notifications | `expo-notifications` (phone), Web Push (laptop), Expo push service for phone push | **VERIFY** current limits |
| Images | `expo-image`, `expo-image-manipulator`, Supabase Storage | Cover thumbnails, Design Inspo uploads |
| State | Zustand for UI state only | |
| Tests | Vitest for `core`, Maestro for a few end-to-end flows | |
| Tooling | pnpm workspaces, ESLint, Prettier, EAS Build, Supabase CLI migrations | |

Styling: plain `StyleSheet` plus a tokens file. Tokens: charcoal `#1A1A18`, surface `#242420`, text `#F0F0EC`, muted `#AAADA0`, accent lime `#D4E157`, danger `#CF6679`, Poppins. Per-collection tint colors live on the collection.

---

## 3. Repo layout

```
pickle/
├── ARCHITECTURE.md
├── CLAUDE.md
├── apps/
│   └── app/                    # Expo: Android, iOS, web
│       ├── app/                # Expo Router routes
│       └── src/
│           ├── data/           # supabase client, queries, mutations, outbox
│           ├── features/       # inbox, library, collection, item, reminders, tidy, builder, settings
│           ├── services/       # capture, notifications, shareIntent
│           ├── ui/             # Button, Chip, Card, Cover, Sheet, FieldInput, StatusChip
│           └── theme/          # tokens
├── packages/
│   └── core/                   # pure TS
│       └── src/
│           ├── types.ts        # section 4
│           ├── builtins.ts     # built-in collections (section 5)
│           ├── fieldLibrary.ts # reusable field definitions
│           ├── validate.ts
│           ├── urls.ts         # normalize, source type
│           ├── suggest.ts      # collection suggestion
│           ├── ingredients.ts  # parse, scale, format
│           ├── filters.ts      # filter model to query params
│           ├── cardLayout.ts   # slots to card view model
│           ├── backup.ts       # export, import, csv
│           └── *.test.ts
└── supabase/
    ├── migrations/
    └── functions/
        ├── enrich/             # title + cover fetch
        └── dispatch-reminders/ # runs every minute
```

## 3b. Two repos

**Frontend repo (this one, deployable):** Expo app, web build served on Vercel, `packages/core`, design tokens, mock data. Talks to Supabase only through `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Contains no service keys.

**Backend repo (private):** Supabase migrations, RLS policies, RPCs (`search_items`, `facet_counts`), Edge Functions (`enrich`, `dispatch-reminders`), pg_cron. Holds all secrets.

**Where built-in collection definitions live: the frontend repo only.** The database stores collections as generic rows (`fields` and `statuses` as JSON), and every backend piece reads those rows rather than knowing about Recipes or Books:
- `search_items` and `facet_counts` filter on `jsonb` using whatever field ids the collection declares.
- Rediscover and Tidy up read `kind` from `collections.statuses`.
- `enrich` and `dispatch-reminders` never look at collection definitions.

So nothing is copied between repos. Instead:
1. `core/builtins.ts` defines the 13 built-ins, each with a stable `builtinKey` (for example `recipes`) and a `version`.
2. After sign-in, the app calls `ensureBuiltIns()`: for each built-in missing from the user's `collections` (matched on `builtin_key`), insert it. This is idempotent.
3. When a built-in's `version` in code is newer than the stored one, the app applies a migration function from `core`: add new fields and statuses, never remove or rename ids, and leave the user's own edits (labels, colors, extra statuses) alone.
4. The backend schema needs a `builtin_key text` column on `collections` with a unique index on `(user_id, builtin_key)`. That is the only backend change this design requires.

If a server-side feature later needs the definitions (for example email-in or a scheduled job that understands fields), publish `packages/core` as a private npm package that both repos install, rather than copying files.

---

## 4. Data model

### 4.1 Types (`packages/core/src/types.ts`)

```ts
export type FieldType =
  | 'text' | 'longtext' | 'number' | 'money' | 'duration'
  | 'select' | 'multiselect' | 'date' | 'checklist' | 'rating'
  | 'toggle' | 'counter' | 'progress' | 'url' | 'image'
  | 'ingredients' | 'exercises';

// Where a field renders on the card. Limits: sub <= 3, pill <= 2, badge 1, line 1, large 1.
export type CardSlot = 'sub' | 'pill' | 'badge' | 'line' | 'large' | 'detail';

export interface FieldDef {
  id: string;               // immutable
  label: string;            // renameable
  type: FieldType;
  slot: CardSlot;
  filter?: boolean;         // appears in filter sheet
  options?: string[];       // select, multiselect suggestions; user-extendable
  unit?: string;
  showWhenDone?: boolean;   // e.g. Key takeaway only appears once status kind = done
  libraryId?: string;       // set when picked from the field library
}

export type StatusKind = 'open' | 'active' | 'done';
export interface StatusDef {
  id: string;               // immutable
  label: string;
  color: string;            // hex
  kind: StatusKind;         // drives behavior
}

export interface CollectionDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  builtIn: boolean;
  version: number;          // bump on schema edits
  fields: FieldDef[];
  statuses: StatusDef[];    // ordered; first is the default
  sort: number;
}

export type Stage = 'inbox' | 'sorted';   // 'later' dropped: Inbox -> sorted is enough
export type SourceType = 'instagram' | 'youtube' | 'github' | 'maps' | 'substack' | 'web' | 'other' | 'manual';
export type EnrichState = 'pending' | 'done' | 'failed' | 'skipped';

export interface ExtraLink { id: string; label: string; url: string; }

export interface Item {
  id: string;
  stage: Stage;
  collectionId: string | null;        // null in the inbox
  statusId: string | null;            // null in the inbox
  sourceUrl: string | null;           // core link, exactly as shared (Instagram, YouTube, article). Null for cards added by hand without a link
  urlKey: string | null;              // normalized, for duplicate detection. Null when there is no link
  sourceType: SourceType;
  title: string | null;
  caption: string | null;
  siteName: string | null;
  coverPath: string | null;           // Storage path
  readableText: string | null;        // saved article copy
  linkState: 'ok' | 'dead' | 'unknown';
  note: string;
  extraLinks: ExtraLink[];            // links you extracted yourself (Amazon, maps, menu)
  data: Record<string, FieldValue>;   // keyed by FieldDef.id
  sharedAt: string;
  lastOpenedAt: string | null;
  openCount: number;
  enrichState: EnrichState;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}

export interface IngredientLine { qty: number | null; unit: string | null; name: string; note?: string; group?: string; done?: boolean; }
export interface ExerciseLine   { name: string; sets: number | null; reps: number | null; unit: 'reps' | 'seconds'; weight?: string; note?: string; group?: string; done?: boolean; }

export type FieldValue =
  | string | number | boolean | string[] | null
  | { text: string; done: boolean }[]      // checklist
  | IngredientLine[] | ExerciseLine[];

export interface Reminder {
  id: string;
  itemId: string;
  kind: 'reminder' | 'task';
  label: string;                      // "Book a table for Saturday"
  fireAt: string | null;              // null = anytime task
  openLink: boolean;                  // tap opens the core link or chosen link
  linkTarget: 'core' | string;        // 'core' or an ExtraLink id or url field id
  completeMarksItem: boolean;         // finishing the task moves the card to completeStatusId
  completeStatusId: string | null;
  notifyPhone: boolean;
  notifyLaptop: boolean;
  doneAt: string | null;
}
```

### 4.2 Postgres (`supabase/migrations`)

```sql
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null, icon text not null, color text not null,
  built_in boolean not null default false,
  builtin_key text,                         -- 'recipes', 'books'... null for user-made
  -- unique (user_id, builtin_key) where builtin_key is not null
  version int not null default 1, sort int not null default 0,
  fields jsonb not null default '[]',
  statuses jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  stage text not null check (stage in ('inbox','sorted')),
  collection_id uuid references collections(id),
  status_id text,
  source_url text, url_key text, source_type text not null,   -- null link allowed for manual cards
  title text, caption text, site_name text, cover_path text,
  readable_text text, link_state text not null default 'unknown',
  note text not null default '',
  extra_links jsonb not null default '[]',
  data jsonb not null default '{}',
  shared_at timestamptz not null default now(),
  last_opened_at timestamptz, open_count int not null default 0,
  enrich_state text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  fts tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(note,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(caption,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(readable_text,'')), 'D')
  ) stored
);
create index items_stage on items(user_id, stage) where deleted_at is null;
create index items_collection on items(collection_id, status_id) where deleted_at is null;
create index items_fts on items using gin(fts);
create index items_data on items using gin(data jsonb_path_ops);
create unique index items_url_key on items(user_id, url_key) where deleted_at is null and url_key is not null;

create table reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  item_id uuid not null references items(id),
  kind text not null check (kind in ('reminder','task')),
  label text not null,
  fire_at timestamptz,
  open_link boolean not null default true,
  link_target text not null default 'core',
  complete_marks_item boolean not null default false,
  complete_status_id text,
  notify_phone boolean not null default true,
  notify_laptop boolean not null default false,
  fired_at timestamptz,
  done_at timestamptz,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index reminders_due on reminders(fire_at) where done_at is null and fired_at is null and deleted_at is null;

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  platform text not null check (platform in ('android','ios','web')),
  name text, push_token text, last_seen timestamptz not null default now()
);

create table profiles (
  user_id uuid primary key references auth.users(id),
  field_library jsonb not null default '[]',   -- user-defined reusable fields
  settings jsonb not null default '{}'         -- previews on/off, rediscover day/time, default reminder time
);
```

Row level security: enable on every table with `using (user_id = auth.uid()) with check (user_id = auth.uid())`. A trigger sets `updated_at = now()` on update. Storage buckets `covers` and `uploads` use per-user folder policies.

Rules:
- **Field IDs never change.** Deleting a field keeps its data in `items.data`.
- **Status IDs never change.** Deleting a status requires moving its cards to another status first.
- **Type changes** are allowed only between `text`, `longtext` and `url`.
- Moving an item to another collection keeps `data` keys that match by field id, parks the rest, and resets status to the new collection's first status.

---

## 5. Built-in collections

F = filterable. Statuses are in order, with `kind` in brackets. Only Title is required. Every item also has: core link, cover, note, saved date, status, extra links, reminders and tasks.

| Collection | Statuses | Fields (type, slot, F) |
|---|---|---|
| Recipes | To make (open) → Made (done) | Cuisine (select, sub, F), Time (duration, sub, F), Meal (select, pill, F), Diet (multiselect, pill, F), Made (counter, badge, F), Serves (number, detail), Protein (number, detail), Ingredients (ingredients, detail), Instructions (longtext, detail), Rating (rating, detail) |
| Restaurants | To try (open) → Been (done) | Area (select, sub, F), Cuisine (select, sub, F), Price 1 to 4 (select, sub, F), Occasion (multiselect, pill, F), Needs booking (toggle, pill, F), Dish to try (text, line), Map link (url, detail), Address (text, detail), Booking link (url, detail), Rating (rating, detail) |
| Places | To visit (open) → Visited (done) | City (select, sub, F), Type (select, sub, F), Trip (select, pill, F), Maps link (url, detail), Best time (text, detail) |
| Events | Upcoming (open) → Went (done), Skipped (done) | Date (date, badge and sub, F), City (select, sub, F), Type (select, sub, F), Maps link (url, detail), Details (longtext, detail) |
| Workouts | To try (open) → In rotation (active) → Retired (done) | Muscle (multiselect, sub, F), Duration (duration, sub, F), Type (select, pill, F), Equipment (multiselect, pill, F), Level (select, pill, F), Times done (counter, badge), Last done (date, line), Exercises (exercises, detail) |
| Wishlist | Want (open) → Bought (done), Skipped (done) | Price (money, large, F), Type (select, sub, F), For whom (select, sub, F), Priority (select, badge, F), Size or variant (text, detail), Date bought (date, detail), Link (url, detail) |
| Books | To read (open) → Reading (active) → Finished (done) | Author (text, sub), Pages (number, sub, F), Genre (select, pill, F), Fiction or non-fiction (select, pill, F), Rating (rating, detail), Finish date (date, detail) |
| Watch | Want (open) → Watching (active) → Watched (done) | Type (select, sub, F), Year (number, sub), Where to watch (select, pill, F), Genre (select, pill, F), Runtime or seasons (text, detail), Rating (rating, detail) |
| YouTube | Queue (open) → Watched (done) | Channel (text, sub), Length (duration, badge, F), Topic (select, pill, F), Start at (text, line) |
| Articles | Unread (open) → Reading (active) → Read (done) | Publication (text, sub), Read time (duration, sub, F), Topic (select, pill, F), Key takeaway (longtext, line, showWhenDone) |
| Opportunities | Interested (open) → Applying (active) → Applied (done) | Type (select, sub, F), Organization (text, sub), Deadline (date, badge as countdown, F), Reward (text, detail), Eligibility (longtext, detail), Steps (checklist, detail) |
| Tools | To try (open) → Using (active) → Dropped (done) | Kind (select, sub, F), Use for (text, line), Install notes (longtext, detail) |
| Design Inspo | Try (open) → Keep (active) → Used (done) | Kind (select, sub, F), Image (image, cover, one upload) |

System behavior, not fields:
- **Offline badge** on Articles when `readable_text` exists.
- **Recipes:** raising Made from 0 moves status To make → Made. Lowering it back to 0 does not move it back.
- **Opportunities and Events:** the date field sorts soonest first by default, overdue items pin to the top and turn red.
- **Wishlist:** Price renders large instead of as a pill.
- Pick-list values (Cuisine, Genre, Topic and so on) are controlled vocabularies. Users add values; filters show only values in use, with counts. This stops "Italian" and "italian food" splitting.

---

## 6. Custom collections and the field library

- The **field library** holds every built-in field definition plus the user's own (`profiles.field_library`). A field picked into a collection is copied with its `libraryId`, so "Price" means the same type and options everywhere.
- The **builder** (`/collections/new`): name, icon, color, status list, then pick fields from the library or create a new one. Each picked field gets a slot and a filter toggle. A live card preview updates as you go.
- **Slot limits** are enforced by the builder: sub up to 3, pill up to 2, badge 1, line 1, large 1. Everything else is `detail`.
- **Card rendering** is a pure function: `cardLayout(collection, item) -> { cover, source, badge, title, subtitle[], pills[], line, large, status, primaryAction, extraLinks[] }`. Cards, rows and search results all use it.
- **Primary action** is derived: Maps link field present (Restaurants, Places, Events) → "Open in Maps"; otherwise "Open link" on the core link.
- **Extra links** show as up to two small buttons on the card and all of them on the detail screen.
- New collections start with the default status list `Open → Active → Done` (editable).

---

## 7. Status system

- Per collection, ordered list of `StatusDef`. First status is the default for new items.
- The status chip on a card and detail screen opens a picker; the status editor (`/c/:id/statuses`) renames, recolors, reorders, adds and removes statuses.
- **Behavior keys off `kind`:**
  - `open`: counts as "to do", eligible for Rediscover, counted in Library hints ("8 to make").
  - `active`: in progress, highlighted, eligible for Rediscover only after 30 days idle.
  - `done`: muted in lists, excluded from Rediscover and Tidy up suggestions, hidden by the default "Not done" filter.
- Filter sheets show a Status filter automatically on every collection.

---

## 8. Capture pipeline

**Manual creation** is a second way in. `createItem({collectionId, title, data, link?})` inserts with `stage = 'sorted'`, `source_type = 'manual'`, the collection's first status, and no enrichment job unless a link is pasted (then the normal normalize, duplicate check and `enrich` steps run, and a duplicate shows the same "Already saved" card). A manual card without a link hides the "Open link" action and uses its Maps link or extra links as the main action when it has one.


```
Share intent ─▶ parse + normalize URL ─▶ duplicate check ─▶ INSERT item (stage=inbox)
                                                               │ instant, or queued in the outbox if offline
                                                               ▼
                                              Edge Function `enrich` (title + cover only)
                                                               │
                                               suggest collection (core/suggest.ts)
```

1. **Normalize** (`core/urls.ts`): strip `utm_*`, `igsh`, `fbclid`, lowercase host, drop trailing slash, resolve known short links → `urlKey`. If an active item has it, show "Already saved in {collection}" and open that card.
2. **Offline:** the app writes to the outbox and shows the same confirmation. The outbox replays in order when the network returns; the unique `url_key` index makes replays safe.
3. **Source detection** from the host: instagram, youtube, github, maps, substack, web, other.
4. **Enrich** (Edge Function, 8 s timeout): fetch Open Graph and `<title>`; YouTube via oEmbed for title and thumbnail (**VERIFY**). Download and store the cover immediately in Storage (Instagram image URLs expire). Nothing else is stored from GitHub or any other site.
5. **Instagram** is best effort. Treat the enricher as replaceable. Failure leaves a generated cover and `enrich_state = failed`, never blocks the card.
6. **Title autofill** from caption first line or page title, trimmed to about 80 characters, always editable.
7. **Suggest a collection** (deterministic): host rules, caption keyword rules ("ingredients", "serves", "sets", "deadline", "tickets"), then learned rules from the user's own sorting history. The suggestion pre-selects a chip, never auto-sorts.
8. **Prefill from caption:** minutes → Time bucket; a date after "deadline", "due" or "closes" → suggested reminder chip; ingredient-looking lines → Ingredients parser.
9. **Readable copy** for articles: extract main text, store in `readable_text` (cap about 100 KB), searchable and readable offline from the local cache.
10. All previews are skipped when the Settings toggle is off.

---

## 9. Ingredients and servings

- `Serves` on the item stores the **base servings**.
- `Ingredients` is a list of `IngredientLine` with optional `group` ("Salmon", "Creamy lemon garlic sauce").
- **Parsing** (`core/ingredients.ts`): "2 tbsps olive oil" → `{qty: 2, unit: 'tbsp', name: 'olive oil'}`. Handles fractions (½, 1/2, 1 1/2), ranges ("2 to 3"), and no-quantity lines ("salt to taste" → `qty: null`). The user can correct any line.
- **Scaling:** the stepper sets `currentServings`; displayed qty = `qty × current / base`. View-only, with "Save as default" optional. `qty: null` never scales.
- **Display:** friendly fractions (½, ¼, ¾, ⅓), unit-aware rounding (no "0.333 tsp"), singular and plural units.
- **Convert** (metric and imperial) is a small lookup table in core. Free, not gated.
- **Check-off:** each line has `done` for shopping. A "reset checks" action clears them.
- Tests: scaling 2 → 4 and 2 → 3, fractions, ranges, null quantities, unit normalization (tbsp, tbsps, tablespoon).

## 10. Exercises

`ExerciseLine` has name, sets, reps, unit (reps or seconds), optional weight text ("20 kg", "BW"), optional group ("Warm-up", "Main"). The detail screen shows `sets × reps` per line with a check-off. "Times done" and "Last done" update when the user taps "+ Done".

---

## 11. Search and filtering

- **Filter model** (`core/filters.ts`): `{ text?, collectionId?, statusKinds?, filters: [{fieldId, op: 'in'|'range'|'is'|'before'|'after', value}] }`.
- Compiled to one parameterized query via an RPC (`search_items`): `fts @@ websearch_to_tsquery`, `data @> ...` for equality, `(data->>'field')::numeric between ...` for ranges, ordered by `ts_rank` then sort.
- **Facet counts** come from an RPC (`facet_counts(collection_id, filters)`) that groups `jsonb_array_elements_text` for multiselect and `data->>field` for select. Filter chips show counts for values in use.
- **Global search** returns results grouped by collection. Reader copy text is included in the index.
- **Sorting:** per collection. Default newest saved. Collections with a date field offer Soonest, with overdue pinned.
- **Saved filters** (later): store a query as a smart collection pinned in Library.
- **Tidy up** query: stage = sorted, status kind ≠ done, `last_opened_at` null or older than 90 days, and `shared_at` older than 90 days; plus a "Dead links" tab where `link_state = 'dead'`.

---

## 12. Reminders and tasks

- Any card can have many. The bell on a card opens the **Add to Reminders** sheet with a Reminder / Task switch, a label, a due date (None, Today, Tomorrow, Pick), "Open link when due" (core link or a chosen extra link), "Mark card {status} when done" (off by default), and "Also notify my laptop".
- A **reminder** has a date and fires a notification. A **task** has an optional date: with no date it sits in **Anytime**; with a date it also notifies.
- Completing a task never changes the card unless `complete_marks_item` is on.
- **Reminders tab** groups: Overdue, Today, Upcoming, Anytime, Done. Round check = reminder, square check = task.
- **Delivery:**
  - Server: `pg_cron` runs `dispatch-reminders` every minute. It selects due rows (`fire_at <= now()`, `fired_at is null`, `done_at is null`), sends Expo push to phone devices and Web Push to laptop devices, then sets `fired_at`.
  - Phone fallback: when a reminder is created or synced, the phone also schedules a local notification (works offline). Both carry `reminderId`; the app drops the second one it sees.
  - **Reconcile on app start:** compare reminders with scheduled local notifications and reschedule missing ones.
  - **VERIFY** Android 13+ notification permission, exact-alarm rules, and manufacturer battery restrictions. Test on your real phone early.
- **On tap:** route to `/item/:id`; if `open_link`, open the chosen link in the browser.
- **Suggested reminders:** a detected date after "deadline", "due" or "closes" shows a one-tap chip, default 9:00. Nothing is scheduled until confirmed.
- **Rediscover** (weekly, off by default, day and time in Settings): one random sorted item whose status kind is `open` (or `active` and idle 30+ days) and not opened in 30+ days. Library shows the same pick with a Shuffle button.

---

## 13. Maps and links

- Maps link field present → "Open in Maps" opens it directly. Otherwise, Restaurants, Places and Events with an address use `https://www.google.com/maps/search/?api=1&query=` + encoded address.
- Core link opens with `Linking.openURL`; opening bumps `open_count` and `last_opened_at`, and a failed open marks `link_state = 'dead'`.
- **Laptop "Open N links":** select cards, then open each core link (and optionally extra links) in new tabs. Browsers may block many tabs from one click: show a one-time "allow pop-ups for Pickle" prompt. **VERIFY** current Chrome and Safari behavior; fallback is a small browser extension.
- Map view with MapLibre is v2 (milestone M9).

---

## 14. Sync and offline

- Auth: email magic link (Supabase Auth). One account across phone and laptop.
- **Reads:** TanStack Query with a persisted cache so the phone opens instantly offline. Realtime subscriptions push changes live.
- **Writes:** optimistic. Offline writes go to the outbox and replay in order. Conflict rule: last write wins by `updated_at`. One user on two devices rarely conflicts; evaluate PowerSync or Electric only if it does.
- **Deletes** set `deleted_at`. Trash keeps items 30 days, then a scheduled function purges them.
- Covers and uploads live in Supabase Storage with per-user paths; the phone caches thumbnails with `expo-image`.

---

## 15. Screens and routes

| Screen | Route | Notes |
|---|---|---|
| Inbox | `/` | One card at a time. Swipe left delete (with Undo), up sort, right remind. Buttons mirror swipes. Progress bar |
| Share confirmation | `/share` (modal) | Editable title, "Sort to" chips with suggestion, Done or Sort now |
| Duplicate | `/share` state | "Already saved in {collection}", Open card |
| Collection picker | `/sort/:itemId` (sheet) | 13 collections plus New, suggestion marked |
| Add a card | `/new` (sheet) | Entry: the + in Library. Pick a collection, then the form. "Paste a link instead" goes to the Inbox flow |
| New card form | `/new/:collectionId` | Same schema-driven form as editing. Name required, link optional, status defaults to the collection's first. The + inside a collection opens this directly and skips the picker. Recipes show a paste-ingredients box that parses lines live |
| Item form | `/item/:id/edit` | Generated from the field list. Filter fields first, "More details" for the rest |
| Item detail | `/item/:id` | Status chip, fields, extra links, ingredients with servings, exercises with sets and reps, bottom action bar |
| Add to Reminders | `/item/:id/remind` (sheet) | Reminder or Task |
| Reminders | `/reminders` | Overdue, Today, Upcoming, Anytime, Done |
| Library | `/library` | Search, Rediscover card, 13 collection tiles with hints |
| Collection | `/c/:id` | Search, active filter chips, status tabs, cover grid |
| Filter sheet | `/c/:id/filters` | Generated from `filter: true` fields plus Status |
| Status editor | `/c/:id/statuses` | Rename, recolor, type (Open, Active, Done), reorder |
| Search results | `/search?q=` | Grouped by collection |
| Tidy up | `/tidy` | Bulk select, Keep, Delete, dead links |
| Collection builder | `/collections/new` | Field library, slots, live preview |
| Settings | `/settings` | Sync account, devices, notifications, previews |
| Backup and trash | `/settings/backup` | Export, import, CSV, auto backup, trash |
| Laptop inbox triage | `/` ≥ 900 px | List plus edit panel, keys: ↑ sort, ← delete, → remind, e edit title, o open |
| Laptop collection | `/c/:id` ≥ 900 px | Filter sidebar with counts, 4-column grid, multi-select with "Open N links" |

Responsive rule: below 900 px mobile layout, above it two or three panes. Same routes, same data.

---

## 16. Backup and export

- `makeBackup()` returns `{ format: 'pickle-backup', version: 2, exportedAt, collections, items, reminders }`, including soft-deleted rows. Covers and uploads are not embedded.
- `parseBackup()` validates `format` and `version` and refuses anything else.
- Per-collection CSV: columns from the collection's fields plus `title`, `source_url`, `status`, `saved_on`, `note`, `extra_links`.
- Because data lives in Supabase, a nightly `pg_dump` on the Supabase side is also advised.

---

## 17. Milestones

Each ends with something that runs. Build one at a time.

**M0 Skeleton.** pnpm monorepo, Expo app with Router, `packages/core` types and builtins, Supabase project with migrations and RLS, magic-link sign-in, CI with lint and Vitest.
*Done when:* you can sign in on the phone build and read an empty `collections` table with built-ins seeded.

**M1 Capture and inbox.** Share intent, normalize and duplicate check, outbox, insert to Supabase, Inbox screen with swipe, Undo, Inbox zero.
*Done when:* sharing a link from Instagram puts it in the inbox in under a second, also in airplane mode (it syncs when back online), and the same link shared twice never duplicates.

**M2 Sort and collections.** Picker, schema-driven form, status chip, Library, collection grid, item detail, extra links, and creating cards by hand (Add a card sheet and form).
*Done when:* all 13 built-ins work, statuses are editable, links you add appear on the card, and a card made by hand with no link saves straight into its collection.

**M3 Search and filters.** `search_items` and `facet_counts` RPCs, filter sheet, status tabs, global search, backup.
*Done when:* "Italian, 30 minutes or less" and "books under 200 pages" both work, and a backup restores identically.

**M4 Reminders and tasks.** Add-to-Reminders sheet, Reminders tab, `dispatch-reminders`, phone push plus local fallback, reconcile on start.
*Done when:* a reminder fires on your physical phone, tapping it opens the saved link, a dateless task sits in Anytime, and it survives an app restart.

**M5 Smart capture.** `enrich` Edge Function (title and cover), collection suggestion, caption prefill, suggested-reminder chip, readable copy and Reader view.
*Done when:* sharing a YouTube link yields title and cover untouched, a recipe reel suggests Recipes and fills Time, and a failed fetch still leaves a usable card.

**M6 Recipes and workouts depth.** Ingredients parser and servings scaling, exercises with sets and reps, counters (Made, Times done).
*Done when:* 2 → 4 servings doubles every quantity, "salt to taste" stays unscaled, and workouts show sets × reps.

**M7 Laptop.** Web build, responsive triage and collection layouts, keyboard shortcuts, multi-select and Open N links, Realtime updates.
*Done when:* a link shared on the phone appears on the laptop within seconds, and three selected cards open in three tabs.

**M8 Custom collections.** Field library, builder with slots and live preview, status editor.
*Done when:* a collection you make from library fields renders cards, forms and filters with no new code.

**M9 Polish.** Tidy up, Rediscover (Library card and weekly notification), Trash, Design Inspo image upload, dead-link checks.

**M10 (later).** Map view, saved filters, iOS share extension.

---

## 18. `CLAUDE.md` for the repo

```md
# Pickle
Read ARCHITECTURE.md before changing anything.
- Pure logic goes in packages/core. No React, Expo or Supabase imports there. Add tests for every function.
- Data access only through functions in apps/app/src/data. Never call the Supabase client from a component.
- Never block saving on the network. Writes go through the outbox. Enrichment can fail.
- Soft delete only. Never hard-delete rows except emptying trash.
- Only Title is required on an item.
- Collections are schema-driven. Do not hardcode screens or cards per collection.
- Statuses behave by kind (open, active, done), never by label.
- Field and status IDs are immutable.
- Enrichment fetches title and cover only.
- Anything marked VERIFY in ARCHITECTURE.md: check current docs before implementing.
- Build one milestone at a time. Stop at each "Done when".
```

---

## 19. Risks and unverified items

1. **Instagram metadata** can stop working at any time. Mitigation: generated covers, replaceable enricher, never required.
2. **`expo-share-intent`** needs a dev build and config plugin. Confirm SDK support before M1.
3. **Reminder reliability on Android** (permissions, exact alarms, battery savers). Test on your phone in M4.
4. **Opening many tabs** from one click can be blocked by browsers. Plan the pop-up prompt, extension fallback.
5. **Offline outbox** is the most custom code in the app. Keep it small, test replay and idempotency.
6. **Supabase free tier** limits (project pausing, storage). Check current limits before relying on it.
7. **iOS:** share extension is extra native work. Android first.
8. **Licensing:** the visual style is inspired by Taskee (MIT) and Streaks, with no code or assets copied.
9. **Privacy:** previews send the shared URL to the previewed site via your Edge Function. Data lives in your Supabase project.
