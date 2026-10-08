import type { MailBridgeRuntime, MailBridgeStatus } from '../mail-bridge.types';

export function isMailBridgeStopped({ status, runtime }: { status: MailBridgeStatus; runtime: MailBridgeRuntime }): boolean {
  return status.status !== 'running' || runtime.socket.destroyed;
}
