import { detectSource, normalizeUrl } from './urls';

/** host -> builtinKey -> times the user chose it. Built from the user's own sorting history. */
export type SortHistory = Record<string, Record<string, number>>;

const RULES: Array<[string, RegExp]> = [
  ['recipes', /\b(ingredients?|serves|servings|recipe|tbsp|tsp|simmer|bake|preheat|saute|sauté|marinate)\b/i],
  ['workouts', /\b(workout|sets|reps|exercise|superset|hiit|glutes|hamstrings|abs routine)\b/i],
  ['opportunities', /\b(deadline|apply|application|scholarship|hackathon|fellowship|grant|internship)\b/i],
  ['events', /\b(tickets?|doors open|line-?up|rsvp|festival|tonight|this saturday|this sunday)\b/i],
  ['restaurants', /\b(restaurant|brunch|reservation|menu|tasting|ramen|omakase|trattoria|bistro)\b/i],
  ['places', /\b(viewpoint|hike|trail|itinerary|things to do|hidden gem|day trip)\b/i],
  ['wishlist', /\b(buy|price|shop|sale|discount|link in bio|amazon|haul)\b/i],
  ['books', /\b(book|novel|author|memoir|reading list|paperback)\b/i],
  ['watch', /\b(film|movie|series|trailer|season|episode|netflix|documentary)\b/i],
  ['inspo', /\b(ui|ux|figma|onboarding|design inspo|branding|typography)\b/i],
];

/** Returns a builtinKey, or null when there is no good guess. Never sorts anything by itself. */
export function suggestCollection(url: string, caption: string = '', history: SortHistory = {}): string | null {
  const n = normalizeUrl(url);
  const source = detectSource(url);

  if (source === 'youtube') return 'youtube';
  if (source === 'github') return 'tools';
  if (source === 'substack') return 'articles';
  if (source === 'maps') return /\b(restaurant|cafe|bar|bistro)\b/i.test(caption) ? 'restaurants' : 'places';

  for (const [key, re] of RULES) if (re.test(caption)) return key;

  if (n) {
    const seen = history[n.host];
    if (seen) {
      const top = Object.entries(seen).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) return top[0];
    }
  }
  return null;
}
