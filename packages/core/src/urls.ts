import type { SourceType } from './types';

interface Parsed { scheme: string; host: string; path: string; query: Array<[string, string]> }

/** Small parser so we do not depend on the URL class, which is incomplete on React Native. */
function parse(raw: string): Parsed | null {
  let text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  const m = text.match(/^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/i);
  if (!m) return null;
  const host = m[2].toLowerCase().replace(/^[^@]*@/, '').replace(/:\d+$/, '');
  if (!host.includes('.')) return null;
  const query: Array<[string, string]> = [];
  if (m[4]) {
    for (const part of m[4].split('&')) {
      if (!part) continue;
      const eq = part.indexOf('=');
      query.push(eq === -1 ? [part, ''] : [part.slice(0, eq), part.slice(eq + 1)]);
    }
  }
  return { scheme: m[1].toLowerCase(), host, path: m[3] || '', query };
}

const TRACKING = /^(utm_.*|igsh|igshid|fbclid|gclid|mc_cid|mc_eid|si|feature|ref_src|ref|share_id)$/i;

export interface NormalizedUrl {
  /** Cleaned URL, safe to open. */
  url: string;
  /** Stable key for duplicate detection. */
  key: string;
  host: string;
}

export function normalizeUrl(raw: string): NormalizedUrl | null {
  const p = parse(raw);
  if (!p) return null;
  let host = p.host.replace(/^www\./, '').replace(/^m\./, '');
  let path = p.path.replace(/\/+$/, '');
  let query = p.query.filter(([k]) => !TRACKING.test(k));

  // youtu.be/ID -> youtube.com/watch?v=ID
  if (host === 'youtu.be' && path.length > 1) {
    query = [['v', path.slice(1)], ...query.filter(([k]) => k !== 'v')];
    path = '/watch';
    host = 'youtube.com';
  }
  if (host === 'youtube.com') {
    // only the video id and start time identify a video
    query = query.filter(([k]) => k === 'v' || k === 't');
  }
  query.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const qs = query.length ? `?${query.map(([k, v]) => (v ? `${k}=${v}` : k)).join('&')}` : '';
  const key = `${host}${path}${qs}`;
  return { url: `https://${host}${path}${qs}`, key, host };
}

export function detectSource(raw: string): SourceType {
  const n = normalizeUrl(raw);
  if (!n) return 'other';
  const h = n.host;
  if (h.endsWith('instagram.com')) return 'instagram';
  if (h.endsWith('youtube.com')) return 'youtube';
  if (h.endsWith('github.com')) return 'github';
  if (h === 'maps.app.goo.gl' || h === 'goo.gl' || h.startsWith('maps.google.') || (h.endsWith('google.com') && n.url.includes('/maps'))) return 'maps';
  if (h.endsWith('substack.com')) return 'substack';
  return 'web';
}

export function hostLabel(raw: string): string {
  return normalizeUrl(raw)?.host ?? raw;
}
