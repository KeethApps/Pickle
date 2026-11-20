# Screens, routes and files

| Design screen | Route | File |
|---|---|---|
| Inbox, Swipe, Inbox zero | `/` | `app/(tabs)/index.tsx`, `src/features/InboxCard.tsx` |
| Laptop inbox triage | `/` at 900 px and up | `src/features/InboxWide.tsx` |
| Paste a link (stands in for the share sheet) | `/paste` | `app/paste.tsx` |
| Share confirmation, Already saved | `/share` | `app/share.tsx` |
| Collection picker | `/sort/:itemId` | `app/sort/[itemId].tsx` |
| Add a card: pick collection | `/new` | `app/new/index.tsx` |
| New card form (any collection) | `/new/:collectionId` | `app/new/[collectionId].tsx`, `src/features/ItemForm.tsx` |
| Item form (edit, or finish sorting) | `/item/:id/edit` | `app/item/[id]/edit.tsx` |
| Item detail (all 13 collections) | `/item/:id` | `app/item/[id]/index.tsx` |
| Add reminder or task | `/item/:id/remind` | `app/item/[id]/remind.tsx` |
| Reminders and tasks | `/reminders` | `app/(tabs)/reminders.tsx` |
| Library, Rediscover | `/library` | `app/(tabs)/library.tsx` |
| Collection (grid, laptop select and open links) | `/c/:id` | `app/c/[id]/index.tsx` |
| Filter sheet | `/c/:id/filters` | `app/c/[id]/filters.tsx` |
| Status editor | `/c/:id/statuses` | `app/c/[id]/statuses.tsx` |
| Search results | `/search` | `app/search.tsx` |
| Tidy up | `/tidy` | `app/tidy.tsx` |
| Collection builder | `/collections/new` | `app/collections/new.tsx` |
| Settings and sync | `/settings` | `app/(tabs)/settings.tsx` |
| Backup and trash | `/settings/backup` | `app/settings/backup.tsx` |

Cards (the 13 collection card designs) are not separate screens: `cardLayout()` in `packages/core/src/cardLayout.ts` turns a collection schema plus an item into a card view model, and `src/features/ItemCard.tsx` draws it.
