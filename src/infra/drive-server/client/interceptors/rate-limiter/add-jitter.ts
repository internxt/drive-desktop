export function addJitter(baseMs: number, maxJitter = 100): number {
  return baseMs + Math.floor(Math.random() * maxJitter);
}
