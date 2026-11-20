import type { Item, Reminder, FieldValue, ExtraLink, IngredientLine, ExerciseLine } from '@pickle/core';
import { addDays, parseIngredientBlock, normalizeUrl, detectSource } from '@pickle/core';

let n = 0;
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const iso = (d: Date) => d.toISOString();
const dateOnly = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface Make {
  id: string;
  title: string;
  collection?: string;
  status?: string;
  url?: string | null;
  data?: Record<string, FieldValue>;
  daysAgo?: number;
  caption?: string;
  extra?: ExtraLink[];
  note?: string;
  dead?: boolean;
  readable?: string;
  opened?: number | null;
}

export function buildMock(now: Date = new Date()) {
  const mk = (m: Make): Item => {
    const saved = iso(addDays(now, -(m.daysAgo ?? 3)));
    const norm = m.url ? normalizeUrl(m.url) : null;
    return {
      id: m.id,
      stage: m.collection ? 'sorted' : 'inbox',
      collectionId: m.collection ?? null,
      statusId: m.status ?? null,
      sourceUrl: norm?.url ?? null,
      urlKey: norm?.key ?? null,
      sourceType: m.url ? detectSource(m.url) : 'manual',
      title: m.title,
      caption: m.caption ?? null,
      siteName: norm?.host ?? null,
      coverUri: null,
      readableText: m.readable ?? null,
      linkState: m.dead ? 'dead' : 'ok',
      note: m.note ?? '',
      extraLinks: m.extra ?? [],
      data: m.data ?? {},
      sharedAt: saved,
      lastOpenedAt: m.opened === undefined ? saved : m.opened === null ? null : iso(addDays(now, -m.opened)),
      openCount: m.opened === null ? 0 : 1,
      enrichState: 'done',
      createdAt: saved,
      updatedAt: saved,
      deletedAt: null,
    };
  };

  const salmon: IngredientLine[] = parseIngredientBlock(`Salmon:
1 lb salmon
1 tsp salt
1 tsp pepper
2 tbsps olive oil
Creamy lemon garlic sauce:
10 oz egg pasta
4 tbsps butter
3 cloves garlic, minced
½ yellow onion, diced
1 cup chicken broth
¾ cups heavy cream
½ lemon, juice and zest
½ cups Parmigiano Reggiano
1 tsp salt
¼ tsps black pepper
fresh parsley to taste`);

  const legs: ExerciseLine[] = [
    { name: 'Hip circles', sets: 2, reps: 10, unit: 'reps', group: 'Warm-up' },
    { name: 'Bodyweight squat', sets: 3, reps: 15, unit: 'reps', group: 'Warm-up' },
    { name: 'Reverse lunge', sets: 3, reps: 12, unit: 'reps', weight: 'each side', group: 'Main' },
    { name: 'Glute bridge', sets: 3, reps: 15, unit: 'reps', weight: 'BW', group: 'Main' },
    { name: 'Wall sit', sets: 3, reps: 40, unit: 'seconds', group: 'Main' },
  ];

  const items: Item[] = [
    // ---- Inbox
    mk({ id: 'in1', title: 'Crispy gochujang chickpea bowl', url: 'https://www.instagram.com/reel/Cx1aB2dEf/?igsh=abc', daysAgo: 0, caption: 'Crispy gochujang chickpea bowl. Ingredients: 1 can chickpeas, 2 tbsp gochujang. Ready in 30 min! #dinner' }),
    mk({ id: 'in2', title: 'MLH Global Hackathon', url: 'https://mlh.io/seasons/2027/events', daysAgo: 1, caption: 'Hackathon season is open. Applications close deadline Dec 1' }),
    mk({ id: 'in3', title: 'Sunday roast, Clapham', url: 'https://www.instagram.com/reel/Dk3mQ9aXz/', daysAgo: 2, caption: 'Best Sunday roast in south London. Book a table, reservation only.' }),
    mk({ id: 'in4', title: 'Why you salt pasta water', url: 'https://kitchennotes.substack.com/p/why-you-salt-pasta-water', daysAgo: 4, caption: 'A 4 minute read on salting pasta water.' }),

    // ---- Recipes
    mk({ id: 'rc1', collection: 'recipes', status: 'to-make', title: 'Creamy lemon garlic salmon pasta', url: 'https://www.instagram.com/reel/Hs82kLmN1/', daysAgo: 12,
      extra: [{ id: 'x1', label: 'Recipe blog', url: 'https://example.com/lemon-garlic-salmon-pasta' }, { id: 'x2', label: 'Parmigiano', url: 'https://example.com/parmigiano' }],
      data: { cuisine: 'Italian', time: 30, meal: 'Dinner', diet: ['High protein'], serves: 2, protein: 45, made: 0, ingredients: salmon, instructions: 'Season and sear the salmon, 4 minutes a side. Cook the pasta. Build the sauce in the same pan: butter, garlic, onion, broth, cream, lemon, parmesan. Toss together.' } }),
    mk({ id: 'rc2', collection: 'recipes', status: 'made', title: 'Baked feta pasta', url: 'https://www.instagram.com/reel/Fe44tAbc2/', daysAgo: 30, data: { cuisine: 'Italian', time: 30, meal: 'Dinner', diet: ['Veg'], made: 2, serves: 2, rating: 4 } }),
    mk({ id: 'rc3', collection: 'recipes', status: 'to-make', title: 'Cacio e pepe, properly', url: 'https://www.instagram.com/reel/Cp11qwe3/', daysAgo: 8, data: { cuisine: 'Italian', time: 15, meal: 'Dinner', made: 0 } }),
    mk({ id: 'rc4', collection: 'recipes', status: 'to-make', title: 'Burrata gnocchi', url: 'https://www.instagram.com/reel/Bg55rty4/', daysAgo: 20, data: { cuisine: 'Italian', time: 30, meal: 'Dinner', diet: ['Veg'], made: 0 } }),
    mk({ id: 'rc5', collection: 'recipes', status: 'to-make', title: 'Lemon orzo soup', url: 'https://www.instagram.com/reel/Lo66uio5/', daysAgo: 22, data: { cuisine: 'Italian', time: 25, meal: 'Lunch', made: 0 } }),
    mk({ id: 'rc6', collection: 'recipes', status: 'to-make', title: 'Miso butter corn', url: 'https://www.instagram.com/reel/Mc77iop6/', daysAgo: 15, data: { cuisine: 'Japanese', time: 15, meal: 'Snack', diet: ['Veg'], made: 0 } }),
    mk({ id: 'rc7', collection: 'recipes', status: 'to-make', title: 'Sheet-pan gnocchi', url: 'https://www.instagram.com/reel/Sg88asd7/', daysAgo: 45, opened: 40, data: { cuisine: 'Italian', time: 45, meal: 'Dinner', made: 0 } }),
    mk({ id: 'rc8', collection: 'recipes', status: 'to-make', title: 'Pickled red onions', url: 'https://www.instagram.com/reel/Pr99zxc8/', daysAgo: 100, opened: null, data: { cuisine: 'Mexican', time: 10, meal: 'Snack', made: 0 } }),

    // ---- Restaurants
    mk({ id: 'rs1', collection: 'restaurants', status: 'to-try', title: 'Pasta Grannies', url: 'https://www.instagram.com/reel/Pg11hjk9/', daysAgo: 6,
      extra: [{ id: 'x3', label: 'Menu', url: 'https://example.com/pasta-grannies-menu' }],
      data: { area: 'Hackney', cuisine: 'Italian', price: '$$', occasion: ['Date night'], needs_booking: true, dish: 'cacio e pepe', map_link: 'https://maps.app.goo.gl/pastagrannies', booking_link: 'https://example.com/book/pasta-grannies' } }),
    mk({ id: 'rs2', collection: 'restaurants', status: 'to-try', title: 'Sunset ramen spot', url: 'https://www.instagram.com/reel/Sr22lmn0/', daysAgo: 95, opened: null, data: { area: 'Soho', cuisine: 'Japanese', price: '$$', occasion: ['Quick'] } }),
    mk({ id: 'rs3', collection: 'restaurants', status: 'been', title: 'Dumpling house', url: 'https://www.instagram.com/reel/Dh33nop1/', daysAgo: 50, data: { area: 'Soho', cuisine: 'Chinese', price: '$', occasion: ['Group'], rating: 5 } }),

    // ---- Places
    mk({ id: 'pl1', collection: 'places', status: 'to-visit', title: 'Miradouro da Graça', url: 'https://www.instagram.com/reel/Mg44pqr2/', daysAgo: 10,
      extra: [{ id: 'x4', label: 'Walking route', url: 'https://example.com/route' }], note: 'Go before sunset, it fills up.',
      data: { city: 'Lisbon', type: 'Viewpoint', trip: 'Lisbon trip', maps_link: 'https://maps.app.goo.gl/graca', best_time: 'Sunset' } }),
    mk({ id: 'pl2', collection: 'places', status: 'to-visit', title: 'Hampstead Heath ponds', url: 'https://www.instagram.com/reel/Hh55stu3/', daysAgo: 25, data: { city: 'London', type: 'Park', maps_link: 'https://maps.app.goo.gl/heath' } }),

    // ---- Events
    mk({ id: 'ev1', collection: 'events', status: 'upcoming', title: 'Night market opening', url: 'https://www.instagram.com/reel/Nm66vwx4/', daysAgo: 5,
      extra: [{ id: 'x5', label: 'Tickets', url: 'https://example.com/tickets' }],
      data: { date: dateOnly(addDays(now, 16)), city: 'London', type: 'Market', maps_link: 'https://maps.app.goo.gl/market', details: 'Free entry. Doors at 17:00, food stalls until 22:00.' } }),
    mk({ id: 'ev2', collection: 'events', status: 'upcoming', title: 'Jazz at the old cinema', url: 'https://www.instagram.com/reel/Jz77yza5/', daysAgo: 9, data: { date: dateOnly(addDays(now, 5)), city: 'London', type: 'Concert' } }),
    mk({ id: 'ev3', collection: 'events', status: 'went', title: 'Design meetup', url: 'https://www.instagram.com/reel/Dm88abc6/', daysAgo: 40, data: { date: dateOnly(addDays(now, -20)), city: 'London', type: 'Meetup' } }),

    // ---- Workouts
    mk({ id: 'wk1', collection: 'workouts', status: 'in-rotation', title: '20 min leg burner', url: 'https://www.instagram.com/reel/Lb99def7/', daysAgo: 30,
      data: { muscle: ['Legs'], duration: 20, type: 'Strength', equipment: ['No equipment'], level: 'Beginner', times_done: 3, last_done: dateOnly(addDays(now, -8)), exercises: legs } }),
    mk({ id: 'wk2', collection: 'workouts', status: 'to-try', title: 'Leg day finisher', url: 'https://www.instagram.com/reel/Ld10ghi8/', daysAgo: 120, opened: null, data: { muscle: ['Legs', 'Glutes'], duration: 10, type: 'Strength', equipment: ['Dumbbells'], level: 'Intermediate', times_done: 0 } }),
    mk({ id: 'wk3', collection: 'workouts', status: 'to-try', title: '10 min mobility reset', url: 'https://www.instagram.com/reel/Mr11jkl9/', daysAgo: 14, data: { muscle: ['Full body'], duration: 10, type: 'Mobility', equipment: ['No equipment'], level: 'Beginner', times_done: 0 } }),

    // ---- Wishlist
    mk({ id: 'wl1', collection: 'wishlist', status: 'want', title: 'Linen overshirt', url: 'https://www.instagram.com/reel/Lo12mno0/', daysAgo: 11,
      extra: [{ id: 'x6', label: 'Reviews video', url: 'https://example.com/reviews' }],
      data: { price: 60, type: 'Clothes', for_whom: 'Sam', priority: 'Soon', variant: 'M, olive', link: 'https://example.com/shop/linen-overshirt' } }),
    mk({ id: 'wl2', collection: 'wishlist', status: 'want', title: 'Linen shirt haul', url: 'https://www.instagram.com/reel/Ls13pqr1/', daysAgo: 180, opened: null, data: { price: 90, type: 'Clothes', for_whom: 'Me', priority: 'Someday' } }),
    mk({ id: 'wl3', collection: 'wishlist', status: 'want', title: 'Pour-over kettle', url: 'https://www.instagram.com/reel/Pk14stu2/', daysAgo: 21, data: { price: 45, type: 'Home', for_whom: 'Me', priority: 'Now' } }),

    // ---- Books
    mk({ id: 'bk1', collection: 'books', status: 'reading', title: 'Four Thousand Weeks', url: 'https://example.com/four-thousand-weeks', daysAgo: 40,
      extra: [{ id: 'x7', label: 'Buy or borrow', url: 'https://example.com/books/four-thousand-weeks' }],
      data: { author: 'Oliver Burkeman', pages: 288, genre: 'Philosophy', fiction: 'Non-fiction' } }),
    mk({ id: 'bk2', collection: 'books', status: 'to-read', title: 'The Overstory', url: 'https://example.com/the-overstory', daysAgo: 60, data: { author: 'Richard Powers', pages: 502, genre: 'Literary', fiction: 'Fiction' } }),

    // ---- Watch
    mk({ id: 'wt1', collection: 'watch', status: 'want', title: 'Past Lives', url: 'https://example.com/past-lives', daysAgo: 7,
      extra: [{ id: 'x8', label: 'Trailer', url: 'https://example.com/past-lives-trailer' }],
      data: { type: 'Film', year: 2023, where: 'Netflix', genre: 'Drama', runtime: '106 min' } }),
    mk({ id: 'wt2', collection: 'watch', status: 'watching', title: 'Slow Horses', url: 'https://example.com/slow-horses', daysAgo: 33, data: { type: 'Series', year: 2022, where: 'Prime', genre: 'Thriller', runtime: '5 seasons' } }),

    // ---- YouTube
    mk({ id: 'yt1', collection: 'youtube', status: 'queue', title: 'How to learn anything faster', url: 'https://youtu.be/abc123XYZ?si=share', daysAgo: 4,
      extra: [{ id: 'x9', label: 'Notes doc', url: 'https://example.com/notes' }],
      data: { channel: 'Study Hall', length: 860, topic: 'Learning', start_at: '2:10' } }),
    mk({ id: 'yt2', collection: 'youtube', status: 'queue', title: 'A quiet walkthrough of a design system', url: 'https://youtu.be/def456UVW', daysAgo: 18, data: { channel: 'Pixel Notes', length: 2400, topic: 'Design' } }),

    // ---- Articles
    mk({ id: 'ar1', collection: 'articles', status: 'unread', title: 'Why you salt pasta water', url: 'https://kitchennotes.substack.com/p/salt-pasta-water-explained', daysAgo: 4,
      readable: 'Salting the water seasons the pasta from the inside, and the amount matters more than the timing. ...',
      data: { publication: 'Kitchen Notes', read_time: 4, topic: 'Food' } }),
    mk({ id: 'ar2', collection: 'articles', status: 'read', title: 'The case for boring software', url: 'https://example.com/boring-software', daysAgo: 25, data: { publication: 'Field Notes', read_time: 9, topic: 'Productivity', takeaway: 'Pick tools you can stop thinking about.' } }),
    mk({ id: 'ar3', collection: 'articles', status: 'unread', title: 'Top 10 desk setups', url: 'https://example.com/desk-setups', daysAgo: 120, opened: null, data: { publication: 'Maker Letter', read_time: 6, topic: 'Design' } }),
    mk({ id: 'ar4', collection: 'articles', status: 'unread', title: 'Cheap flights hack', url: 'https://example.com/cheap-flights', daysAgo: 150, opened: null, dead: true, readable: 'Book on Tuesdays and compare nearby airports. ...', data: { publication: 'Wandering', read_time: 7, topic: 'Travel' } }),

    // ---- Opportunities
    mk({ id: 'op1', collection: 'opportunities', status: 'applying', title: 'MLH Global Hackathon', url: 'https://mlh.io/seasons/2027/events', daysAgo: 6,
      extra: [{ id: 'x10', label: 'Registration form', url: 'https://example.com/register' }, { id: 'x11', label: 'Rules and prizes', url: 'https://example.com/rules' }],
      data: { type: 'Hackathon', organization: 'Major League Hacking', deadline: dateOnly(addDays(now, 11)), eligibility: 'Team of 2 to 4. Check residency rules.', steps: [{ text: 'Register your team', done: true }, { text: 'Pick an idea', done: false }, { text: 'Submit before 23:59', done: false }] } }),
    mk({ id: 'op2', collection: 'opportunities', status: 'interested', title: 'Rhodes scholarship portal', url: 'https://example.com/rhodes', daysAgo: 30, data: { type: 'Scholarship', organization: 'Rhodes Trust', deadline: dateOnly(addDays(now, -1)) } }),
    mk({ id: 'op3', collection: 'opportunities', status: 'interested', title: 'Chevening applications', url: 'https://example.com/chevening', daysAgo: 12, data: { type: 'Scholarship', organization: 'Chevening', deadline: dateOnly(addDays(now, 10)) } }),

    // ---- Tools
    mk({ id: 'tl1', collection: 'tools', status: 'to-try', title: 'charmbracelet/gum', url: 'https://github.com/charmbracelet/gum', daysAgo: 16,
      extra: [{ id: 'x12', label: 'Docs', url: 'https://example.com/gum-docs' }],
      data: { kind: 'CLI', use_for: 'Nicer shell scripts', install: 'brew install gum' } }),
    mk({ id: 'tl2', collection: 'tools', status: 'using', title: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep', daysAgo: 70, data: { kind: 'CLI', use_for: 'Fast code search' } }),

    // ---- Design Inspo
    mk({ id: 'di1', collection: 'inspo', status: 'try', title: 'Calm onboarding flow', url: 'https://www.instagram.com/reel/Co15vwx3/', daysAgo: 9,
      extra: [{ id: 'x13', label: 'Figma file', url: 'https://example.com/figma' }], data: { kind: 'Mobile UI' } }),
    mk({ id: 'di2', collection: 'inspo', status: 'keep', title: 'Warm editorial type pairing', url: 'https://www.instagram.com/reel/Wt16yza4/', daysAgo: 35, data: { kind: 'Branding' } }),
  ];

  const at = (d: number, h: number, m = 0) => {
    const x = addDays(now, d);
    x.setHours(h, m, 0, 0);
    return iso(x);
  };
  const rem = (itemId: string, kind: Reminder['kind'], label: string, fireAt: string | null, extra: Partial<Reminder> = {}): Reminder => ({
    id: uid('rem'), itemId, kind, label, fireAt, openLink: true, linkTarget: 'core', completeMarksItem: false,
    completeStatusId: null, notifyPhone: true, notifyLaptop: false, doneAt: null, createdAt: iso(now), ...extra,
  });

  const reminders: Reminder[] = [
    rem('op2', 'task', 'Apply for the Rhodes scholarship', at(-1, 9)),
    rem('rs1', 'task', 'Book a table for Saturday', at(0, 18), { linkTarget: 'booking_link' }),
    rem('rc3', 'reminder', 'Check out: Cacio e pepe, properly', at(0, 17)),
    rem('op1', 'reminder', 'Check out: MLH Global Hackathon', at(8, 9)),
    rem('rc1', 'task', 'Buy Parmigiano', null, { openLink: false }),
    rem('tl1', 'task', 'Try gum for shell scripts', null),
  ];

  return { items, reminders };
}
