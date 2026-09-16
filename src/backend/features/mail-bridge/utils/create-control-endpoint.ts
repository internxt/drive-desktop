/**
 * Creates the unique, private named-pipe endpoint that Desktop listens on while the Bridge starts.
 * The random identifier prevents separate accounts or Bridge launches from sharing a control channel.
 */
export function createControlEndpoint(id: string): string {
  return `\\\\.\\pipe\\internxt-mail-bridge-${id}`;
}
