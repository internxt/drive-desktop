import { vi } from 'vitest';
import { useBackupsInterval } from './useBackupsInterval';
import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';

describe('useBackupsInterval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have the default state of backupsInterval as BACKUP_MANUAL_INTERVAL value', () => {
    const { result } = renderHook(() => useBackupsInterval());
    expect(result.current.backupsInterval).toBe(-1);
  });

  it('should properly retrieve the backupsInterval and set it to the state', async () => {
    vi.mocked(window.electron.getBackupsInterval).mockResolvedValue(3600000); // 1h
    const { result, waitForNextUpdate } = renderHook(() => useBackupsInterval());

    await waitForNextUpdate();

    expect(window.electron.getBackupsInterval).toHaveBeenCalled();
    expect(result.current.backupsInterval).toBe(3600000);
  });

  it('should properly update the backupsInterval and call the electron function to set the interval', async () => {
    const { result } = renderHook(() => useBackupsInterval());

    await waitFor(() => {
      expect(result.current.backupsInterval).toBe(-1);
    });

    await act(async () => {
      await result.current.updateBackupsInterval(7200000);
    });

    expect(result.current.backupsInterval).toBe(7200000);
    expect(window.electron.setBackupsInterval).toHaveBeenCalledWith(7200000);
  });
});
