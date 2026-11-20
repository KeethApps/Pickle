import { describe, it, expect } from 'vitest';
import { normalizeUrl, detectSource, hostLabel } from './urls';

describe('normalizeUrl', () => {
  it('strips tracking params, www and trailing slash', () => {
    const a = normalizeUrl('https://www.instagram.com/reel/Cx1aB2dEf/?igsh=abc123&utm_source=ig');
    const b = normalizeUrl('instagram.com/reel/Cx1aB2dEf');
    expect(a?.key).toBe('instagram.com/reel/Cx1aB2dEf');
    expect(a?.key).toBe(b?.key);
  });
  it('treats youtu.be like youtube.com/watch', () => {
    const a = normalizeUrl('https://youtu.be/abc123?si=xyz');
    const b = normalizeUrl('https://www.youtube.com/watch?v=abc123&feature=share');
    expect(a?.key).toBe(b?.key);
  });
  it('rejects things that are not links', () => {
    expect(normalizeUrl('hello world')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('notaurl')).toBeNull();
  });
});

describe('detectSource and hostLabel', () => {
  it('detects common sources', () => {
    expect(detectSource('https://instagram.com/reel/x')).toBe('instagram');
    expect(detectSource('https://youtu.be/x')).toBe('youtube');
    expect(detectSource('https://github.com/a/b')).toBe('github');
    expect(detectSource('https://maps.app.goo.gl/abc')).toBe('maps');
    expect(detectSource('https://kitchen.substack.com/p/x')).toBe('substack');
    expect(detectSource('https://example.com/x')).toBe('web');
  });
  it('labels hosts', () => {
    expect(hostLabel('https://www.mlh.io/events')).toBe('mlh.io');
  });
});
