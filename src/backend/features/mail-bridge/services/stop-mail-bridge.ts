import { closeControlServer } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { MailBridgeResources } from '../mail-bridge.types';

export async function stopMailBridgeResources({
  child,
  server,
  socket,
}: MailBridgeResources): Promise<{ data: undefined; error: undefined } | { data: undefined; error: Error }> {
  if (socket) {
    socket.destroy();
  }
  const closed = await closeControlServer({ server });
  if (child && !child.killed) {
    child.kill();
  }
  return closed;
}
