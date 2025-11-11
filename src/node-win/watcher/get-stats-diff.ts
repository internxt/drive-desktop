import { Stats } from 'node:fs';

type Props = {
  prev: Stats;
  curr: Stats;
};

export function getStatsDiff({ prev, curr }: Props) {
  const diff: Record<string, unknown> = {};
  const keys = Object.keys(prev) as Array<keyof Stats>;

  for (const key of keys) {
    if (prev[key] instanceof Date || curr[key] instanceof Date) continue;

    if (prev[key] !== curr[key]) {
      diff[key] = { prev: prev[key], curr: curr[key] };
    }
  }

  return diff;
}
