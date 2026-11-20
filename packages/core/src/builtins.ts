import type { CollectionDef, FieldDef, StatusDef, StatusKind } from './types';

const OPEN = '#AAADA0';
const ACTIVE = '#D4E157';
const DONE = '#8FD3C4';
const SKIP = '#6E7066';

const st = (id: string, label: string, kind: StatusKind, color?: string): StatusDef => ({
  id,
  label,
  kind,
  color: color ?? (kind === 'open' ? OPEN : kind === 'active' ? ACTIVE : DONE),
});

type F = Omit<FieldDef, 'id' | 'label' | 'type' | 'slot'>;
const f = (id: string, label: string, type: FieldDef['type'], slot: FieldDef['slot'], extra: F = {}): FieldDef =>
  ({ id, label, type, slot, ...extra });

const make = (
  key: string,
  name: string,
  icon: string,
  color: string,
  sort: number,
  statuses: StatusDef[],
  fields: FieldDef[],
  extra: Partial<CollectionDef> = {},
): CollectionDef => ({
  id: key,
  builtinKey: key,
  name,
  icon,
  color,
  builtIn: true,
  version: 1,
  sort,
  statuses,
  fields,
  ...extra,
});

export const BUILTIN_COLLECTIONS: CollectionDef[] = [
  make('recipes', 'Recipes', 'pot', '#E39B6B', 0,
    [st('to-make', 'To make', 'open'), st('made', 'Made', 'done')],
    [
      f('cuisine', 'Cuisine', 'select', 'sub', { filter: true, options: ['Korean', 'Italian', 'Indian', 'Mexican', 'Thai', 'Japanese'] }),
      f('time', 'Time', 'duration', 'sub', { filter: true, unit: 'min' }),
      f('meal', 'Meal', 'select', 'pill', { filter: true, options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'] }),
      f('diet', 'Diet', 'multiselect', 'pill', { filter: true, options: ['Veg', 'Vegan', 'Gluten free', 'High protein'] }),
      f('made', 'Made', 'counter', 'badge', { filter: true, shortLabel: 'Made' }),
      f('serves', 'Serves', 'number', 'detail'),
      f('protein', 'Protein', 'number', 'detail', { unit: 'g' }),
      f('ingredients', 'Ingredients', 'ingredients', 'detail'),
      f('instructions', 'Instructions', 'longtext', 'detail'),
      f('rating', 'Rating', 'rating', 'detail'),
    ],
    { actionLabel: 'Open recipe', quickAction: { label: 'Made it', counterFieldId: 'made' } }),

  make('restaurants', 'Restaurants', 'fork', '#E07A7A', 1,
    [st('to-try', 'To try', 'open'), st('been', 'Been', 'done')],
    [
      f('area', 'Area', 'select', 'sub', { filter: true }),
      f('cuisine', 'Cuisine', 'select', 'sub', { filter: true, options: ['Italian', 'Japanese', 'Indian', 'Thai', 'Mexican'] }),
      f('price', 'Price', 'select', 'sub', { filter: true, options: ['$', '$$', '$$$', '$$$$'] }),
      f('occasion', 'Occasion', 'multiselect', 'pill', { filter: true, options: ['Date night', 'Group', 'Quick', 'Special'] }),
      f('needs_booking', 'Needs booking', 'toggle', 'pill', { filter: true }),
      f('dish', 'Dish to try', 'text', 'line'),
      f('map_link', 'Map link', 'url', 'detail', { role: 'maps' }),
      f('address', 'Address', 'text', 'detail'),
      f('booking_link', 'Booking link', 'url', 'detail', { role: 'booking' }),
      f('rating', 'Rating', 'rating', 'detail'),
    ],
    { quickAction: { label: 'Been', statusId: 'been' } }),

  make('places', 'Places', 'pin', '#7FB6D9', 2,
    [st('to-visit', 'To visit', 'open'), st('visited', 'Visited', 'done')],
    [
      f('city', 'City', 'select', 'sub', { filter: true }),
      f('type', 'Type', 'select', 'sub', { filter: true, options: ['Cafe', 'Bar', 'Park', 'Museum', 'Shop', 'Viewpoint', 'Day trip'] }),
      f('trip', 'Trip', 'select', 'pill', { filter: true }),
      f('maps_link', 'Maps link', 'url', 'detail', { role: 'maps' }),
      f('best_time', 'Best time', 'text', 'detail'),
    ],
    { quickAction: { label: 'Visited', statusId: 'visited' } }),

  make('events', 'Events', 'cal', '#6FD0C8', 3,
    [st('upcoming', 'Upcoming', 'open'), st('went', 'Went', 'done'), st('skipped', 'Skipped', 'done', SKIP)],
    [
      f('date', 'Date', 'date', 'badge', { filter: true, format: 'date' }),
      f('city', 'City', 'select', 'sub', { filter: true }),
      f('type', 'Type', 'select', 'sub', { filter: true, options: ['Market', 'Concert', 'Talk', 'Festival', 'Meetup'] }),
      f('maps_link', 'Maps link', 'url', 'detail', { role: 'maps' }),
      f('details', 'Details', 'longtext', 'detail'),
    ],
    { quickAction: { label: 'Went', statusId: 'went' } }),

  make('workouts', 'Workouts', 'dumb', '#9AD17A', 4,
    [st('to-try', 'To try', 'open'), st('in-rotation', 'In rotation', 'active'), st('retired', 'Retired', 'done')],
    [
      f('muscle', 'Muscle', 'multiselect', 'sub', { filter: true, options: ['Legs', 'Glutes', 'Core', 'Back', 'Chest', 'Arms', 'Shoulders', 'Full body'] }),
      f('duration', 'Duration', 'duration', 'sub', { filter: true, unit: 'min' }),
      f('type', 'Type', 'select', 'pill', { filter: true, options: ['Strength', 'HIIT', 'Mobility', 'Cardio', 'Yoga'] }),
      f('equipment', 'Equipment', 'multiselect', 'pill', { filter: true, options: ['No equipment', 'Dumbbells', 'Bands', 'Gym'] }),
      f('level', 'Level', 'select', 'pill', { filter: true, options: ['Beginner', 'Intermediate', 'Advanced'] }),
      f('times_done', 'Times done', 'counter', 'badge', { shortLabel: 'Done' }),
      f('last_done', 'Last done', 'date', 'line', { format: 'date' }),
      f('exercises', 'Exercises', 'exercises', 'detail'),
    ],
    { actionLabel: 'Start', quickAction: { label: '+ Done', counterFieldId: 'times_done' } }),

  make('wishlist', 'Wishlist', 'bag', '#E6C86E', 5,
    [st('want', 'Want', 'open'), st('bought', 'Bought', 'done'), st('skipped', 'Skipped', 'done', SKIP)],
    [
      f('price', 'Price', 'money', 'large', { filter: true, unit: '$' }),
      f('type', 'Type', 'select', 'sub', { filter: true, options: ['Clothes', 'Tech', 'Home', 'Gift', 'Books'] }),
      f('for_whom', 'For whom', 'select', 'sub', { filter: true, options: ['Me'] }),
      f('priority', 'Priority', 'select', 'badge', { filter: true, options: ['Someday', 'Soon', 'Now'] }),
      f('variant', 'Size or variant', 'text', 'detail'),
      f('date_bought', 'Date bought', 'date', 'detail', { format: 'date' }),
      f('link', 'Link', 'url', 'detail', { role: 'store' }),
    ],
    { actionLabel: 'Open store', quickAction: { label: 'Bought', statusId: 'bought' } }),

  make('books', 'Books', 'book', '#B79AE0', 6,
    [st('to-read', 'To read', 'open'), st('reading', 'Reading', 'active'), st('finished', 'Finished', 'done')],
    [
      f('author', 'Author', 'text', 'sub'),
      f('pages', 'Pages', 'number', 'sub', { filter: true, unit: 'pages' }),
      f('genre', 'Genre', 'select', 'pill', { filter: true }),
      f('fiction', 'Fiction or non-fiction', 'select', 'pill', { filter: true, options: ['Fiction', 'Non-fiction'] }),
      f('rating', 'Rating', 'rating', 'detail'),
      f('finish_date', 'Finish date', 'date', 'detail', { format: 'date' }),
    ],
    { quickAction: { label: 'Finished', statusId: 'finished' } }),

  make('watch', 'Watch', 'tv', '#E58BB4', 7,
    [st('want', 'Want', 'open'), st('watching', 'Watching', 'active'), st('watched', 'Watched', 'done')],
    [
      f('type', 'Type', 'select', 'sub', { filter: true, options: ['Film', 'Series', 'Documentary', 'Anime'] }),
      f('year', 'Year', 'number', 'sub'),
      f('where', 'Where to watch', 'select', 'pill', { filter: true, options: ['Netflix', 'Prime', 'Disney+', 'Cinema', 'Other'] }),
      f('genre', 'Genre', 'select', 'pill', { filter: true }),
      f('runtime', 'Runtime or seasons', 'text', 'detail'),
      f('rating', 'Rating', 'rating', 'detail'),
    ],
    { quickAction: { label: 'Watched', statusId: 'watched' } }),

  make('youtube', 'YouTube', 'yt', '#EE7A70', 8,
    [st('queue', 'Queue', 'open'), st('watched', 'Watched', 'done')],
    [
      f('channel', 'Channel', 'text', 'sub'),
      f('length', 'Length', 'duration', 'badge', { filter: true, unit: 'sec' }),
      f('topic', 'Topic', 'select', 'pill', { filter: true }),
      f('start_at', 'Start at', 'text', 'line'),
    ],
    { actionLabel: 'Watch', quickAction: { label: 'Watched', statusId: 'watched' } }),

  make('articles', 'Articles', 'doc', '#A8C8A0', 9,
    [st('unread', 'Unread', 'open'), st('reading', 'Reading', 'active'), st('read', 'Read', 'done')],
    [
      f('publication', 'Publication', 'text', 'sub'),
      f('read_time', 'Read time', 'duration', 'sub', { filter: true, unit: 'min' }),
      f('topic', 'Topic', 'select', 'pill', { filter: true }),
      f('takeaway', 'Key takeaway', 'longtext', 'line', { showWhenDone: true }),
    ],
    { actionLabel: 'Read', quickAction: { label: 'Mark read', statusId: 'read' } }),

  make('opportunities', 'Opportunities', 'flag', '#D4E157', 10,
    [st('interested', 'Interested', 'open'), st('applying', 'Applying', 'active'), st('applied', 'Applied', 'done')],
    [
      f('type', 'Type', 'select', 'sub', { filter: true, options: ['Hackathon', 'Scholarship', 'Job', 'Fellowship', 'Grant'] }),
      f('organization', 'Organization', 'text', 'sub'),
      f('deadline', 'Deadline', 'date', 'badge', { filter: true, format: 'countdown' }),
      f('reward', 'Reward', 'text', 'detail'),
      f('eligibility', 'Eligibility', 'longtext', 'detail'),
      f('steps', 'Steps', 'checklist', 'detail'),
    ],
    { quickAction: { label: 'Applied', statusId: 'applied' } }),

  make('tools', 'Tools', 'code', '#8DA4E8', 11,
    [st('to-try', 'To try', 'open'), st('using', 'Using', 'active'), st('dropped', 'Dropped', 'done')],
    [
      f('kind', 'Kind', 'select', 'sub', { filter: true, options: ['Library', 'App', 'CLI', 'Template', 'Design resource'] }),
      f('use_for', 'Use for', 'text', 'line'),
      f('install', 'Install notes', 'longtext', 'detail'),
    ],
    { actionLabel: 'Open repo', quickAction: { label: 'Using', statusId: 'using' } }),

  make('inspo', 'Design Inspo', 'img', '#E8E8E0', 12,
    [st('try', 'Try', 'open'), st('keep', 'Keep', 'active'), st('used', 'Used', 'done')],
    [
      f('kind', 'Kind', 'select', 'sub', { filter: true, options: ['Mobile UI', 'Web', 'Branding', 'Illustration'] }),
      f('image', 'Image', 'image', 'detail'),
    ],
    { quickAction: { label: 'Keep', statusId: 'keep' } }),
];

export const DEFAULT_STATUSES: StatusDef[] = [
  st('open', 'Open', 'open'),
  st('active', 'Active', 'active'),
  st('done', 'Done', 'done'),
];

/** Every built-in field, de-duplicated by id and type: the starting field library for the builder. */
export function builtinFieldLibrary(): FieldDef[] {
  const seen = new Map<string, FieldDef>();
  for (const c of BUILTIN_COLLECTIONS) {
    for (const fd of c.fields) {
      const key = `${fd.id}:${fd.type}`;
      if (!seen.has(key)) seen.set(key, { ...fd, libraryId: key, slot: 'detail', filter: false });
    }
  }
  return [...seen.values()];
}

export function getBuiltin(key: string): CollectionDef | undefined {
  return BUILTIN_COLLECTIONS.find((c) => c.builtinKey === key);
}
