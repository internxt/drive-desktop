import { electronStore } from '@/apps/main/config';

export function isDangledApplied() {
  const isApplied = electronStore.get('patch-executed-2-5-1');
  return { isApplied };
}

export function applyDangled() {
  electronStore.set('patch-executed-2-5-1', true);
}
