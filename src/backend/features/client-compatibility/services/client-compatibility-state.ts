import { ClientCompatibilityState, isClientVersionUnsupported, logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastToWidget } from '@/apps/main/windows';
import { haltFeatures } from './halt-features';
import { showClientCompatibilityNotification } from './show-client-compatibility-notification';

let state: ClientCompatibilityState = { status: 'up_to_date' };
let isNotificationShown = false;

export function getClientCompatibility() {
  return state;
}

export function isClientUnsupported() {
  return isClientVersionUnsupported(state);
}

/**
 * v2.7.2 Alexis Mora
 * Once unsupported, the state does not change again for the rest of the session: the running version cannot
 * change without restarting the app, and the next launch checks the backend again.
 * The native notification is shown only once per session, whether it comes from startup or from a rejected request.
 */
export function setClientCompatibility({ state: next }: { state: ClientCompatibilityState }) {
  if (isClientUnsupported()) return;

  logger.debug({ msg: 'Client compatibility', status: next.status });
  state = next;

  if (state.status === 'up_to_date') return;

  broadcastToWidget({ name: 'client-compatibility-changed', data: state });

  if (state.status === 'unsupported') haltFeatures();

  if (!isNotificationShown) {
    isNotificationShown = true;
    showClientCompatibilityNotification({ state });
  }
}
