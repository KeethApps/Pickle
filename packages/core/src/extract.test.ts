import { describe, it, expect } from 'vitest';
import { extractMinutes, extractDeadline, extractHashtags } from './extract';
import { suggestCollection } from './suggest';

describe('extractMinutes', () => {
  it('reads minutes and hours', () => {
    expect(extractMinutes('ready in 30 min!')).toBe(30);
    expect(extractMinutes('a 20-minute workout')).toBe(20);
    expect(extractMinutes('takes 1 hour 15 min')).toBe(75);
    expect(extractMinutes('no time here')).toBeNull();
  });
});

describe('extractDeadline', () => {
  const now = new Date(2026, 10, 20); // 20 Nov 2026
  it('finds month-name dates after the keyword', () => {
    expect(extractDeadline('Applications close deadline Dec 1', now)).toBe('2026-12-01');
    expect(extractDeadline('due 5th January', now)).toBe('2027-01-05');
  });
  it('returns null without a deadline word', () => {
    expect(extractDeadline('see you on Dec 1', now)).toBeNull();
  });
});

describe('extractHashtags', () => {
  it('lowercases tags', () => {
    expect(extractHashtags('Yum #Dinner #QuickMeals')).toEqual(['dinner', 'quickmeals']);
  });
});

describe('suggestCollection', () => {
  it('uses host rules first', () => {
    expect(suggestCollection('https://youtu.be/x')).toBe('youtube');
    expect(suggestCollection('https://github.com/a/b')).toBe('tools');
  });
  it('uses caption keywords', () => {
    expect(suggestCollection('https://instagram.com/reel/x', 'Ingredients: 2 tbsp oil. Serves 2')).toBe('recipes');
    expect(suggestCollection('https://instagram.com/reel/x', 'Hackathon deadline Dec 1')).toBe('opportunities');
  });
  it('returns null when there is nothing to go on', () => {
    expect(suggestCollection('https://example.com/x', 'hello')).toBeNull();
  });
  it('learns from history', () => {
    expect(suggestCollection('https://example.com/x', '', { 'example.com': { tools: 3 } })).toBe('tools');
  });
});

import { parseExerciseBlock, exercisesToText, formatSetsReps } from './exercises';
describe('exercises', () => {
  it('parses sets x reps, seconds and weights', () => {
    const lines = parseExerciseBlock('Warm-up:\nHip circles 2x10\nMain:\nWall sit 3 x 40s\nSquat 4x8 @ 20 kg');
    expect(lines.map((l) => [l.name, l.sets, l.reps, l.unit, l.group])).toEqual([
      ['Hip circles', 2, 10, 'reps', 'Warm-up'], ['Wall sit', 3, 40, 'seconds', 'Main'], ['Squat', 4, 8, 'reps', 'Main'],
    ]);
    expect(formatSetsReps(lines[1])).toBe('3 × 40 s');
    expect(lines[2].weight).toBe('20 kg');
  });
  it('round-trips', () => {
    const text = 'Warm-up:\nHip circles 2x10\nMain:\nWall sit 3x40s\nSquat 4x8 @ 20 kg';
    expect(exercisesToText(parseExerciseBlock(text))).toBe(text);
  });
});
