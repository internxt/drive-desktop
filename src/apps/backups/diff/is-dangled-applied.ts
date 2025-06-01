import Store from 'electron-store';

const store = new Store();
const PATCH_2_5_1 = 'patch-executed-2-5-1';

export function isDangledApplied() {
  const isApplied = store.get(PATCH_2_5_1, false);
  return { isApplied };
}

export function applyDangled() {
  store.set(PATCH_2_5_1, true);
}
