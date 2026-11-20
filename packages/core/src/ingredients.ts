import type { IngredientLine } from './types';

const UNICODE_FRAC: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

/** Canonical unit names. Keys are lower-case spellings seen in the wild. */
const UNIT_ALIASES: Record<string, string> = {
  tsp: 'tsp', tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tbsps: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  cup: 'cup', cups: 'cup',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g', gr: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can',
  slice: 'slice', slices: 'slice',
  pinch: 'pinch', pinches: 'pinch',
  bunch: 'bunch', bunches: 'bunch',
};

/** Units that read naturally in the plural when the quantity is above 1. */
const PLURAL_UNITS = new Set(['cup', 'clove', 'can', 'slice', 'pinch', 'bunch']);
const PLURAL_FORM: Record<string, string> = { pinch: 'pinches', bunch: 'bunches' };

export function canonicalUnit(raw: string): string | null {
  return UNIT_ALIASES[raw.toLowerCase().replace(/\.$/, '')] ?? null;
}

/** Parse "1", "1.5", "1/2", "1 1/2", "½", "1½" into a number. Returns null if the text is not a quantity. */
export function parseQuantity(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  const pure = t.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (pure) return Number(pure[2]) !== 0 ? Number(pure[1]) / Number(pure[2]) : null;

  let total = 0;
  let rest = t;

  const lead = rest.match(/^(\d+(?:\.\d+)?)/);
  if (lead) {
    total += parseFloat(lead[1]);
    rest = rest.slice(lead[1].length);
  }
  rest = rest.trim();

  const uni = rest.match(/^([½⅓⅔¼¾⅛⅜⅝⅞])/);
  if (uni) {
    total += UNICODE_FRAC[uni[1]];
    rest = rest.slice(1).trim();
  } else {
    const frac = rest.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (frac && Number(frac[2]) !== 0) {
      total += Number(frac[1]) / Number(frac[2]);
      rest = '';
    }
  }
  if (rest.length > 0) return null;
  return total > 0 ? total : null;
}

const QTY_TOKEN = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?[½⅓⅔¼¾⅛⅜⅝⅞]?|[½⅓⅔¼¾⅛⅜⅝⅞])/;

/**
 * "2 tbsps olive oil" -> { qty: 2, unit: 'tbsp', name: 'olive oil' }
 * "3 cloves garlic, minced" -> { qty: 3, unit: 'clove', name: 'garlic', note: 'minced' }
 * "salt to taste" -> { qty: null, unit: null, name: 'salt to taste' }
 * "2 to 3 lemons" -> uses the upper bound so scaling stays safe.
 */
export function parseIngredientLine(input: string): IngredientLine {
  let line = input.trim().replace(/^[-•*]\s*/, '');
  if (!line) return { qty: null, unit: null, name: '' };

  // ranges: "2 to 3", "2-3"
  const range = line.match(/^(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)\s+(.*)$/i);
  let qty: number | null = null;
  if (range) {
    qty = parseFloat(range[2]);
    line = range[3];
  } else {
    const m = line.match(QTY_TOKEN);
    if (m) {
      const parsed = parseQuantity(m[1]);
      if (parsed !== null) {
        qty = parsed;
        line = line.slice(m[1].length).trim();
      }
    }
  }

  let unit: string | null = null;
  if (qty !== null) {
    const parts = line.split(/\s+/);
    const maybe = parts[0] ? canonicalUnit(parts[0]) : null;
    if (maybe) {
      unit = maybe;
      line = parts.slice(1).join(' ');
    }
  }

  let note: string | undefined;
  const comma = line.indexOf(',');
  if (comma > 0) {
    note = line.slice(comma + 1).trim() || undefined;
    line = line.slice(0, comma).trim();
  }
  line = line.replace(/^of\s+/i, '');

  return { qty, unit, name: line, ...(note ? { note } : {}) };
}

/** One ingredient per line. A line ending with ":" or a short heading-only line starts a group. */
export function parseIngredientBlock(text: string): IngredientLine[] {
  const out: IngredientLine[] = [];
  let group: string | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith(':')) {
      group = line.slice(0, -1).trim();
      continue;
    }
    const parsed = parseIngredientLine(line);
    if (!parsed.name) continue;
    out.push(group ? { ...parsed, group } : parsed);
  }
  return out;
}

const FRACTIONS: Array<[number, string]> = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];

/** Format a quantity with friendly fractions: 1.5 -> "1½", 0.333 -> "⅓", 12 -> "12". */
export function formatQty(q: number): string {
  if (!isFinite(q) || q <= 0) return '';
  const whole = Math.floor(q + 1e-9);
  const frac = q - whole;
  if (frac < 0.06) return String(whole);
  if (frac > 0.94) return String(whole + 1);
  let best = FRACTIONS[0];
  let bestDiff = Infinity;
  for (const fr of FRACTIONS) {
    const diff = Math.abs(frac - fr[0]);
    if (diff < bestDiff) { best = fr; bestDiff = diff; }
  }
  if (bestDiff > 0.06) {
    // no clean fraction: one decimal place
    return String(Math.round(q * 10) / 10);
  }
  return whole > 0 ? `${whole}${best[1]}` : best[1];
}

export function scaleQty(qty: number | null, base: number, current: number): number | null {
  if (qty === null || base <= 0 || current <= 0) return qty;
  return qty * (current / base);
}

export function formatUnit(unit: string | null, qty: number | null): string {
  if (!unit) return '';
  if (qty !== null && qty > 1 && PLURAL_UNITS.has(unit)) return PLURAL_FORM[unit] ?? `${unit}s`;
  return unit;
}

/** "2 lb", "1½ cups", "" for lines with no quantity. */
export function formatAmount(line: IngredientLine, base: number, current: number): string {
  const q = scaleQty(line.qty, base, current);
  if (q === null) return '';
  const n = formatQty(q);
  const u = formatUnit(line.unit, q);
  return u ? `${n} ${u}` : n;
}

export function ingredientGroups(lines: IngredientLine[]): Array<{ group: string | null; lines: Array<{ line: IngredientLine; index: number }> }> {
  const groups: Array<{ group: string | null; lines: Array<{ line: IngredientLine; index: number }> }> = [];
  lines.forEach((line, index) => {
    const g = line.group ?? null;
    let last = groups[groups.length - 1];
    if (!last || last.group !== g) {
      last = { group: g, lines: [] };
      groups.push(last);
    }
    last.lines.push({ line, index });
  });
  return groups;
}

/** Turns lines back into the pasteable text form, so editing round-trips: "Sauce:" headings and "2 tbsp olive oil, note". */
export function ingredientsToText(lines: IngredientLine[]): string {
  const out: string[] = [];
  let last: string | undefined;
  for (const l of lines) {
    if (l.group && l.group !== last) out.push(`${l.group}:`);
    last = l.group;
    const amount = l.qty !== null ? [formatQty(l.qty), formatUnit(l.unit, l.qty)].filter(Boolean).join(' ') : '';
    const body = [amount, l.name].filter(Boolean).join(' ');
    out.push(l.note ? `${body}, ${l.note}` : body);
  }
  return out.join('\n');
}
