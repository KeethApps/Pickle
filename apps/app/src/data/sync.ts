/**
 * sync.ts — Supabase CRUD operations for the Pickle data layer.
 *
 * Every function is fire-and-forget from the store's perspective: the store
 * updates local Zustand state optimistically, then calls the sync function.
 * Network failures are logged but never block the UI.
 *
 * Rules:
 * - Never send user_id (defaults to auth.uid() via RLS).
 * - Soft delete only (set deleted_at). Hard delete only for emptying trash.
 * - The collection_id sent to Supabase must be the real UUID, not the builtinKey.
 */
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAuthStore } from './auth';
import {
  itemToRow, rowToItem, itemPatchToRow,
  collectionToRow, rowToCollection,
  reminderToRow, rowToReminder,
} from './mapper';
import type { CollectionDef, Item, Reminder } from '@pickle/core';

// ---------- Internal helpers ----------

function sb() {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  // Only sync when the user is actually signed in (not in demo mode)
  const user = useAuthStore.getState().user;
  if (!user) return null;
  return supabase;
}

function warn(op: string, error: unknown) {
  console.warn(`[sync] ${op}:`, error);
}

// ---------- Load all data for a user ----------

export interface UserData {
  collections: CollectionDef[];
  items: Item[];
  reminders: Reminder[];
}

/** Fetch all collections, items, and reminders for the signed-in user. */
export async function loadUserData(): Promise<UserData | null> {
  const supabase = sb();
  if (!supabase) return null;

  try {
    const [colRes, itemRes, remRes] = await Promise.all([
      supabase.from('collections').select('*').is('deleted_at', null).order('sort'),
      supabase.from('items').select('*').order('shared_at', { ascending: false }),
      supabase.from('reminders').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
    ]);

    if (colRes.error) { warn('loadCollections', colRes.error); return null; }
    if (itemRes.error) { warn('loadItems', itemRes.error); return null; }
    if (remRes.error) { warn('loadReminders', remRes.error); return null; }

    return {
      collections: (colRes.data ?? []).map(rowToCollection),
      items: (itemRes.data ?? []).map(rowToItem),
      reminders: (remRes.data ?? []).map(rowToReminder),
    };
  } catch (err) {
    warn('loadUserData', err);
    return null;
  }
}

// ---------- Items ----------

/** Insert a new item. */
export async function syncInsertItem(item: Item): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('items').insert(itemToRow(item));
    if (error) warn('insertItem', error);
  } catch (err) { warn('insertItem', err); }
}

/** Update specific fields on an item. */
export async function syncUpdateItem(id: string, patch: Partial<Item>): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const row = itemPatchToRow(patch);
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from('items').update(row).eq('id', id);
    if (error) warn('updateItem', error);
  } catch (err) { warn('updateItem', err); }
}

/** Soft-delete an item (set deleted_at). */
export async function syncDeleteItem(id: string, deletedAt: string): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).eq('id', id);
    if (error) warn('deleteItem', error);
  } catch (err) { warn('deleteItem', err); }
}

/** Soft-delete many items. */
export async function syncDeleteMany(ids: string[], deletedAt: string): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('items').update({ deleted_at: deletedAt }).in('id', ids);
    if (error) warn('deleteMany', error);
  } catch (err) { warn('deleteMany', err); }
}

/** Restore a soft-deleted item. */
export async function syncRestoreItem(id: string): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('items').update({ deleted_at: null }).eq('id', id);
    if (error) warn('restoreItem', error);
  } catch (err) { warn('restoreItem', err); }
}

/** Hard-delete all items that have deleted_at set (emptying trash). */
export async function syncEmptyTrash(): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    // RLS policy only allows DELETE where deleted_at IS NOT NULL
    const { error } = await supabase.from('items').delete().not('deleted_at', 'is', null);
    if (error) warn('emptyTrash', error);
  } catch (err) { warn('emptyTrash', err); }
}

// ---------- Collections ----------

/** Insert a new collection. */
export async function syncInsertCollection(c: CollectionDef): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('collections').insert(collectionToRow(c));
    if (error) warn('insertCollection', error);
  } catch (err) { warn('insertCollection', err); }
}

/** Update a collection. */
export async function syncUpdateCollection(c: CollectionDef): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const row = collectionToRow(c);
    // Don't send the id in the update payload
    const { id, ...rest } = row;
    const { error } = await supabase.from('collections').update(rest).eq('id', c.id);
    if (error) warn('updateCollection', error);
  } catch (err) { warn('updateCollection', err); }
}

// ---------- Reminders ----------

/** Insert a new reminder. */
export async function syncInsertReminder(r: Reminder): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('reminders').insert(reminderToRow(r));
    if (error) warn('insertReminder', error);
  } catch (err) { warn('insertReminder', err); }
}

/** Update a reminder (e.g. toggle done). */
export async function syncUpdateReminder(id: string, patch: Record<string, unknown>): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('reminders').update(patch).eq('id', id);
    if (error) warn('updateReminder', error);
  } catch (err) { warn('updateReminder', err); }
}

/** Soft-delete a reminder. */
export async function syncDeleteReminder(id: string): Promise<void> {
  const supabase = sb();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('reminders').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) warn('deleteReminder', error);
  } catch (err) { warn('deleteReminder', err); }
}
