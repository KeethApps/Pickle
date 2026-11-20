# Pickle (frontend repo)
Read ARCHITECTURE.md before changing anything. This is the public frontend repo. The Supabase migrations, RLS and Edge Functions live in the private backend repo.

- Pure logic goes in packages/core. No React, Expo or Supabase imports there. Add tests for every function. Run `pnpm test`.
- Screens are schema-driven. Do not hardcode screens or cards per collection. Cards render from `cardLayout`, forms from the field list, detail from the collection fields.
- Built-in collections are defined once, in packages/core/src/builtins.ts. The app seeds them into each user's `collections` rows after sign-in. Do not copy them into the backend repo.
- Statuses behave by `kind` (open, active, done), never by label. Field and status ids are immutable.
- Only the title is required on an item. A card may have no link.
- All data access goes through apps/app/src/data. Never call the Supabase client from a component.
- Never put a service key in this repo. Only EXPO_PUBLIC_* values.
- Never block saving on the network. Enrichment can fail.
- Soft delete only. Never hard-delete rows except emptying trash.
- Anything marked VERIFY in ARCHITECTURE.md: check current docs before implementing.
- Build one milestone at a time. Stop at each "Done when".
