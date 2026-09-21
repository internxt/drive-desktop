import { startupTimeoutMs } from '../mail-bridge.types';

/**
 * Creates the cancellable timeout that limits a Mail Bridge startup phase.
 */
export function createStartupTimeout() {
  let timeout: NodeJS.Timeout;
  const result = new Promise<{ data: undefined; error: Error }>((resolveTimeout) => {
    timeout = setTimeout(() => resolveTimeout({ data: undefined, error: new Error('Mail Bridge startup timed out') }), startupTimeoutMs);
  });

  return { result, cancel: () => clearTimeout(timeout) };
}
