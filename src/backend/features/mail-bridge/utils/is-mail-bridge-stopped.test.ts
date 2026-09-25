/* eslint-disable sonarjs/no-hardcoded-passwords */
import { ChildProcess } from 'node:child_process';
import { Server, Socket } from 'node:net';
import type { MailBridgeRuntime } from '../mail-bridge.types';
import { isMailBridgeStopped } from './is-mail-bridge-stopped';

describe('is-mail-bridge-stopped', () => {
  it('reports a running Bridge when its control socket is open', () => {
    const runtime = createMailBridgeRuntime();
    expect(isMailBridgeStopped({ status: { status: 'running', error: undefined, connection: runtime.connection }, runtime })).toBe(false);
  });

  it('reports a stopped Bridge when its status is not running', () => {
    const runtime = createMailBridgeRuntime();

    expect(isMailBridgeStopped({ status: { status: 'stopped', error: undefined }, runtime })).toBe(true);
  });

  it('reports a stopped Bridge when its control socket is destroyed', () => {
    const runtime = createMailBridgeRuntime();
    runtime.socket.destroy();
    expect(isMailBridgeStopped({ status: { status: 'running', error: undefined, connection: runtime.connection }, runtime })).toBe(true);
  });
});

function createMailBridgeRuntime(): MailBridgeRuntime {
  return {
    child: new ChildProcess(),
    server: new Server(),
    socket: new Socket(),
    connection: {
      hostname: '127.0.0.1',
      imapPort: 1143,
      smtpPort: 2025,
      username: 'user@internxt.com',
      password: 'password',
      imapSecurity: 'STARTTLS',
      smtpSecurity: 'None',
    },
  };
}
