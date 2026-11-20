const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "30 min", "30 minutes", "30-minute", "1 hr", "1 hour 15 min" -> minutes. */
export function extractMinutes(caption: string): number | null {
  const text = caption.toLowerCase();
  const hm = text.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)\s*(?:and\s*)?(\d+)\s*(?:m|min|mins|minutes?)/);
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  const h = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  if (h) return Math.round(parseFloat(h[1]) * 60);
  const m = text.match(/(\d+)\s*[- ]?\s*(?:m|min|mins|minute|minutes)\b/);
  if (m) return Number(m[1]);
  return null;
}

/**
 * Finds a date after "deadline", "due", "closes", "by" and returns an ISO yyyy-mm-dd.
 * Understands "Dec 1", "1 Dec", "1st December", "12/01" (month/day), and assumes the next occurrence.
 */
export function extractDeadline(caption: string, now: Date = new Date()): string | null {
  const text = caption.toLowerCase();
  const lead = text.match(/(?:deadline|due|closes?|closing|apply by|applications? close)[:\s-]*(?:on\s*)?(.{0,24})/);
  if (!lead) return null;
  const tail = lead[1];

  let month = -1;
  let day = -1;

  const a = tail.match(/([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?/);
  const b = tail.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})/);
  const c = tail.match(/(\d{1,2})\/(\d{1,2})/);
  if (a && MONTHS.includes(a[1].slice(0, 3))) { month = MONTHS.indexOf(a[1].slice(0, 3)); day = Number(a[2]); }
  else if (b && MONTHS.includes(b[2].slice(0, 3))) { month = MONTHS.indexOf(b[2].slice(0, 3)); day = Number(b[1]); }
  else if (c) { month = Number(c[1]) - 1; day = Number(c[2]); }
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  let year = now.getFullYear();
  const candidate = new Date(year, month, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate.getTime() < today.getTime()) year += 1;
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function extractHashtags(caption: string): string[] {
  return [...caption.matchAll(/#([a-z0-9_]+)/gi)].map((m) => m[1].toLowerCase());
}
