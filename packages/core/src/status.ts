import type { CollectionDef, Item, StatusDef, StatusKind } from './types';

export function getStatus(collection: CollectionDef, statusId: string | null): StatusDef | null {
  if (!statusId) return null;
  return collection.statuses.find((s) => s.id === statusId) ?? null;
}

export function defaultStatus(collection: CollectionDef): StatusDef {
  return collection.statuses[0];
}

export function statusKindOf(collection: CollectionDef, item: Item): StatusKind | null {
  return getStatus(collection, item.statusId)?.kind ?? null;
}

export function isDone(collection: CollectionDef, item: Item): boolean {
  return statusKindOf(collection, item) === 'done';
}

/** The first status of kind "done": where "mark done" sends a card when a collection has no quick action. */
export function firstDoneStatus(collection: CollectionDef): StatusDef | null {
  return collection.statuses.find((s) => s.kind === 'done') ?? null;
}
