/* eslint-disable @typescript-eslint/no-explicit-any */
export function getNestedCauseMessage(e: unknown): string | undefined {
  if (!e || typeof e !== 'object') return;
  const c1 = (e as any).cause;
  const c2 = c1 && typeof c1 === 'object' ? (c1 as any).cause : undefined;
  const msg = c2 && typeof c2 === 'object' ? (c2 as any).message : undefined;
  return typeof msg === 'string' ? msg : undefined;
}
