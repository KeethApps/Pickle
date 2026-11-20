import type { ExerciseLine } from './types';

/**
 * "Reverse lunge 3x12", "Wall sit 3 x 40s", "Squat 4 x 8 @ 20kg", "Plank 2x45 sec"
 * Lines ending with ":" start a group such as "Warm-up:".
 */
export function parseExerciseBlock(text: string): ExerciseLine[] {
  const out: ExerciseLine[] = [];
  let group: string | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith(':')) { group = line.slice(0, -1).trim(); continue; }
    const m = line.match(/^(.*?)\s+(\d+)\s*[x×]\s*(\d+)\s*(s|sec|secs|seconds)?\s*(?:@\s*(.+))?$/i);
    const base: ExerciseLine = m
      ? {
          name: m[1].trim(),
          sets: Number(m[2]),
          reps: Number(m[3]),
          unit: m[4] ? 'seconds' : 'reps',
          ...(m[5] ? { weight: m[5].trim() } : {}),
        }
      : { name: line, sets: null, reps: null, unit: 'reps' };
    out.push(group ? { ...base, group } : base);
  }
  return out;
}

export function formatSetsReps(e: ExerciseLine): string {
  if (e.sets === null || e.reps === null) return '';
  return e.unit === 'seconds' ? `${e.sets} × ${e.reps} s` : `${e.sets} × ${e.reps}`;
}

export function exercisesToText(lines: ExerciseLine[]): string {
  const out: string[] = [];
  let last: string | undefined;
  for (const e of lines) {
    if (e.group && e.group !== last) out.push(`${e.group}:`);
    last = e.group;
    const sr = e.sets !== null && e.reps !== null ? ` ${e.sets}x${e.reps}${e.unit === 'seconds' ? 's' : ''}` : '';
    out.push(`${e.name}${sr}${e.weight ? ` @ ${e.weight}` : ''}`);
  }
  return out.join('\n');
}
