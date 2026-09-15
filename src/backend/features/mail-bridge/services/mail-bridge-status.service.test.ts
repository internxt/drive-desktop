import { createMailBridgeStatus } from './mail-bridge-status.service';

describe('mail-bridge-status.service', () => {
  it('starts stopped and notifies callers when the status changes', () => {
    const onStatusChange = vi.fn();
    const status = createMailBridgeStatus({ onStatusChange });

    expect(status.getStatus()).toEqual({ status: 'stopped', error: undefined });

    status.setStatus({ status: 'starting', error: undefined });

    expect(status.getStatus()).toEqual({ status: 'starting', error: undefined });
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'starting', error: undefined });
  });
});