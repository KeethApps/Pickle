# Pickle (frontend)

Share any link or reel to Pickle. It waits in an inbox until you sort it into a collection. Search, filter, turn any card into a reminder or task, and open the links you extracted, on your phone or your laptop.

This is the **frontend repo**: an Expo app (Android first, iOS later) that also builds to the web, and the shared `core` package. It runs today on **demo data held in memory**, so you can click through every designed screen before the backend exists. The Supabase migrations and Edge Functions live in a separate private repo.

Design canvas: https://claude.ai/artifact/Exxs8Atg6bbssHyMtgm41d
Plan and decisions: [ARCHITECTURE.md](ARCHITECTURE.md) (v0.3). Rules for Claude Code: [CLAUDE.md](CLAUDE.md).

## What is in here

```
apps/app/              Expo Router app (phone and web)
  app/                 routes (see docs/SCREENS.md)
  src/data/            zustand store with demo data, query state, Supabase client (not wired yet)
  src/features/        cards, forms, inbox, detail blocks, sidebar
  src/ui/              Text, Button, Chip, Sheet, Inputs, icons
  src/theme/tokens.ts  colors, radii, Poppins
packages/core/         pure TypeScript, no React: types, the 13 built-in collections,
                       cardLayout, filters, ingredient scaling, URL normalising, suggestions, CSV
docs/SCREENS.md        design screen -> route -> file
```

## Run it

Needs Node 22 and pnpm.

```bash
pnpm bootstrap     # pnpm install, then `expo install --fix` to pin versions that match the Expo SDK
pnpm web           # laptop layout in the browser
pnpm start         # then press a for Android, or scan with a dev build
pnpm test          # core unit tests
pnpm typecheck
```

`package.json` lists most Expo packages as `*` on purpose. `expo install --fix` (run by `pnpm bootstrap` and by CI) rewrites them to the versions that match the SDK in `expo` (`~58.0.0`). If you move to a newer SDK, run `npx expo install expo@latest` inside `apps/app`, then `npx expo install --fix`.

Expo Go is fine for this frontend. You need a **development build** (`eas build --profile development`) once you add the Android share target, which is milestone M1.

## Deploy the web build to Vercel

1. Push this repo to GitHub and import it in Vercel. Leave the root directory as the repo root.
2. Vercel reads `vercel.json`: install with pnpm, build with `pnpm --filter @pickle/app build:web`, serve `apps/app/dist`, and rewrite every path to `index.html`.
3. In Project Settings > Environment Variables add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public values only) when the backend is ready.

## What works with demo data

- **Capture and triage:** paste a link (stands in for the system share sheet), saved to the Inbox in one step, duplicate detection that strips tracking parameters, swipe left to delete with Undo, up to sort, right to remind, Inbox zero.
- **Sort and create by hand:** collection picker with a suggestion, schema-driven form (filter fields first, "More details" for the rest), "Add a card" from the Library + (pick the collection first), the + inside a collection skips the picker. Only the name is required; the link is optional.
- **Browse:** Library with Rediscover, collection grid with search, filters, status tabs and sort, filter sheet with counts, global search (including saved article text), 13 detail screens from one schema-driven component.
- **Recipes:** pasted ingredients are parsed into quantity, unit and name; the servings stepper rescales; lines like "salt to taste" never scale.
- **Workouts:** exercises with sets, reps, seconds and weight.
- **Statuses:** every collection has its own editable list (name, color, Open / Active / Done, order).
- **Reminders and tasks:** any card can have both. A task may have no date, and can mark the card done when completed.
- **Setup:** collection builder (pick fields from the library, set slot and filter, live preview), Tidy up, backup (JSON, CSV per collection, restore from trash), Settings.
- **Laptop (900 px and up):** sidebar, two-pane inbox triage with keys (↑ sort, ← delete, → remind, `o` open, `j` / `k` move), 4-column grid with multi-select and "Open N links in tabs". Browsers may block extra tabs; the app tells you.

## Not built yet (on purpose)

| Missing | Where it lands |
|---|---|
| Real data, sign-in, sync | M0/M1: swap `src/data/store.ts` actions for Supabase calls through `src/data/supabase.ts` |
| Android share target (`expo-share-intent`) | M1, needs a dev build |
| Link previews (title, cover) and reader copy | M5, an Edge Function in the backend repo |
| Push and local notifications that actually fire | M4 |
| Image upload to storage (picker works, file stays local) | M1 with the backend |
| Map view | later (M10) |

## Verification status (please read)

This code was written in an environment with **no network access**, so it has **not been installed or run**. What was checked:

- `packages/core`: type-checks with strict TypeScript and its 43 unit tests pass (run with a stand-in test runner, since vitest could not be installed).
- The store logic (duplicate detection, sorting, counters, quick actions, undo, reminders, backup round trip) was exercised in Node against the real code.
- `apps/app`: type-checked and syntax-checked against stub types for React Native, Expo Router and friends. That catches wrong props on our own code, not mistakes in how third-party libraries are called.

Expect a first-run fix or two. Things most worth watching: Expo Router modal behavior (`transparentModal` sheets), `router.dismissTo('/')` after sorting (use `router.replace` if your Router version lacks it), and tab bar options in your SDK's React Navigation version.

## Connecting the backend later

The private backend repo ships the schema and RLS. Built-in collections are **not** copied there: after sign-in the app inserts any missing built-ins into the user's `collections` rows (matched on `builtin_key`) and upgrades them by `version`. See ARCHITECTURE.md section 3b.
