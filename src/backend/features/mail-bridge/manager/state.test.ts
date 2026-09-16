import { createMailBridgeManagerState, updateMailBridgeManagerState } from './state';

describe('state', () => {
  it('creates an empty runtime-resource state', () => {
    expect(createMailBridgeManagerState()).toEqual({
      child: undefined,
      server: undefined,
      socket: undefined,
      connection: undefined,
      stopping: false,
    });
  });

  it('returns an updated state without changing the previous state', () => {
    const state = createMailBridgeManagerState();
    const updated = updateMailBridgeManagerState({ state, updates: { stopping: true } });

    expect(state.stopping).toBe(false);
    expect(updated.stopping).toBe(true);
  });
});