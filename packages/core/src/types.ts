export type FieldType =
  | 'text' | 'longtext' | 'number' | 'money' | 'duration'
  | 'select' | 'multiselect' | 'date' | 'checklist' | 'rating'
  | 'toggle' | 'counter' | 'progress' | 'url' | 'image'
  | 'ingredients' | 'exercises';

/** Where a field renders on a card. Limits: sub <= 3, pill <= 2, badge 1, line 1, large 1. */
export type CardSlot = 'sub' | 'pill' | 'badge' | 'line' | 'large' | 'detail';

export interface FieldDef {
  id: string;                 // immutable: item data is keyed by it
  label: string;              // safe to rename
  type: FieldType;
  slot: CardSlot;
  filter?: boolean;           // shows in the filter sheet
  options?: string[];         // select / multiselect suggestions, user-extendable
  unit?: string;              // number unit, money symbol, or 'min' | 'sec' for duration
  shortLabel?: string;        // used in badges, e.g. "Made" for a counter
  format?: 'countdown' | 'date';
  role?: 'maps' | 'booking' | 'store';   // url fields with a special meaning
  showWhenDone?: boolean;     // only show once the status kind is done
  libraryId?: string;
}

export type StatusKind = 'open' | 'active' | 'done';
export interface StatusDef {
  id: string;
  label: string;
  color: string;
  kind: StatusKind;
}

export interface QuickAction {
  label: string;
  statusId?: string;          // move the card to this status
  counterFieldId?: string;    // or bump this counter
}

export interface CollectionDef {
  id: string;
  builtinKey: string | null;  // 'recipes', 'books'... null for user-made
  name: string;
  icon: string;               // key into the icon set
  color: string;
  builtIn: boolean;
  version: number;
  fields: FieldDef[];
  statuses: StatusDef[];      // ordered; first is the default
  sort: number;
  actionLabel?: string;       // label of the main "open" action, default "Open link"
  quickAction?: QuickAction;  // the bottom-bar "mark done" button
}

export type Stage = 'inbox' | 'sorted';
export type SourceType =
  | 'instagram' | 'youtube' | 'github' | 'maps' | 'substack' | 'web' | 'other' | 'manual';
export type EnrichState = 'pending' | 'done' | 'failed' | 'skipped';

export interface ExtraLink { id: string; label: string; url: string }

export interface IngredientLine {
  qty: number | null;
  unit: string | null;
  name: string;
  note?: string;
  group?: string;
  done?: boolean;
}

export interface ExerciseLine {
  name: string;
  sets: number | null;
  reps: number | null;
  unit: 'reps' | 'seconds';
  weight?: string;
  note?: string;
  group?: string;
  done?: boolean;
}

export interface ChecklistLine { text: string; done: boolean }

export type FieldValue =
  | string | number | boolean | string[] | null
  | ChecklistLine[] | IngredientLine[] | ExerciseLine[];

export interface Item {
  id: string;
  stage: Stage;
  collectionId: string | null;
  statusId: string | null;
  sourceUrl: string | null;
  urlKey: string | null;
  sourceType: SourceType;
  title: string | null;
  caption: string | null;
  siteName: string | null;
  coverUri: string | null;
  readableText: string | null;
  linkState: 'ok' | 'dead' | 'unknown';
  note: string;
  extraLinks: ExtraLink[];
  data: Record<string, FieldValue>;
  sharedAt: string;
  lastOpenedAt: string | null;
  openCount: number;
  enrichState: EnrichState;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Reminder {
  id: string;
  itemId: string;
  kind: 'reminder' | 'task';
  label: string;
  fireAt: string | null;            // null = anytime task
  openLink: boolean;
  linkTarget: string;               // 'core' or an ExtraLink id
  completeMarksItem: boolean;
  completeStatusId: string | null;
  notifyPhone: boolean;
  notifyLaptop: boolean;
  doneAt: string | null;
  createdAt: string;
}
