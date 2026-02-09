import { delay } from './delay';
import { DelayState } from './rate-limiter.types';

export async function waitForDelay(delayState: DelayState, ms: number): Promise<void> {
  if (delayState.pending) {
    await delayState.pending;
    return;
  }

  delayState.pending = delay(ms);
  await delayState.pending;
  delayState.pending = null;
}
