import type { MockInstance } from 'vitest';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('client-compatibility-state', () => {
  let broadcastToWidgetMock: MockInstance;
  let haltFeaturesMock: MockInstance;
  let showNotificationMock: MockInstance;
  let stateModule: typeof import('./client-compatibility-state');

  /**
   * The state lives at module level, so every test loads a fresh module. The spies are attached to the
   * dependencies loaded after the reset, otherwise the fresh module would call the real ones.
   */
  beforeEach(async () => {
    vi.resetModules();
    broadcastToWidgetMock = partialSpyOn(await import('@/apps/main/windows'), 'broadcastToWidget');
    haltFeaturesMock = partialSpyOn(await import('./halt-features'), 'haltFeatures');
    showNotificationMock = partialSpyOn(await import('./show-client-compatibility-notification'), 'showClientCompatibilityNotification');
    stateModule = await import('./client-compatibility-state');
  });

  it('should start as up to date', () => {
    // Then
    expect(stateModule.getClientCompatibility()).toStrictEqual({ status: 'up_to_date' });
    expect(stateModule.isClientUnsupported()).toBe(false);
  });

  it('should not do anything when the version is up to date', () => {
    // When
    stateModule.setClientCompatibility({ state: { status: 'up_to_date' } });
    // Then
    expect(broadcastToWidgetMock).not.toHaveBeenCalled();
    expect(haltFeaturesMock).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  it('should show the banner and notify without halting features when the version is deprecated', () => {
    // Given
    const state = { status: 'deprecated', sunsetAt: '2026-12-01T00:00:00.000Z' } as const;
    // When
    stateModule.setClientCompatibility({ state });
    // Then
    expect(broadcastToWidgetMock).toHaveBeenCalledWith({ name: 'client-compatibility-changed', data: state });
    expect(haltFeaturesMock).not.toHaveBeenCalled();
    expect(showNotificationMock).toHaveBeenCalledWith({ state });
  });

  it('should halt features, show the banner and notify when the version is unsupported', () => {
    // When
    stateModule.setClientCompatibility({ state: { status: 'unsupported' } });
    // Then
    expect(stateModule.isClientUnsupported()).toBe(true);
    expect(broadcastToWidgetMock).toHaveBeenCalledWith({ name: 'client-compatibility-changed', data: { status: 'unsupported' } });
    expect(haltFeaturesMock).toHaveBeenCalledOnce();
    expect(showNotificationMock).toHaveBeenCalledOnce();
  });

  it('should show the native notification only once per session', () => {
    // When
    stateModule.setClientCompatibility({ state: { status: 'deprecated' } });
    stateModule.setClientCompatibility({ state: { status: 'unsupported' } });
    // Then
    expect(showNotificationMock).toHaveBeenCalledOnce();
    expect(haltFeaturesMock).toHaveBeenCalledOnce();
  });

  it('should stay unsupported for the rest of the session', () => {
    // Given
    stateModule.setClientCompatibility({ state: { status: 'unsupported' } });
    // When
    stateModule.setClientCompatibility({ state: { status: 'unsupported' } });
    stateModule.setClientCompatibility({ state: { status: 'up_to_date' } });
    // Then
    expect(stateModule.getClientCompatibility()).toStrictEqual({ status: 'unsupported' });
    expect(haltFeaturesMock).toHaveBeenCalledOnce();
    expect(broadcastToWidgetMock).toHaveBeenCalledOnce();
  });
});
