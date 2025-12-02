import { renderHook, act } from '@testing-library/react-hooks';
import { DriveOperationInfo } from '../../../../shared/types';
import { useDriveInfoHistoryLogic } from './useDriveInfoHistoryLogic';

describe('useDriveInfoHistoryLogic', () => {
  const mockItem: DriveOperationInfo = { name: 'file1', action: 'DOWNLOADING', progress: 0, oldName: 'file1' };
  const mockItem2: DriveOperationInfo = { name: 'file2', action: 'DOWNLOADING', progress: 0, oldName: 'file2' };
  const mockItem3: DriveOperationInfo = { name: 'file3', action: 'DOWNLOADING', progress: 0, oldName: 'file3' };
  const mockItem4: DriveOperationInfo = { name: 'file4', action: 'DOWNLOADING', progress: 0, oldName: 'file4' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add item to history', () => {
    const { result } = renderHook(() => useDriveInfoHistoryLogic());
    act(() => {
      result.current.addItemToHistory(mockItem);
    });
    expect(result.current.driveHistory).toEqual([mockItem]);
  });

  it('should add multiple new items to the history', () => {
    const { result } = renderHook(() => useDriveInfoHistoryLogic());

    act(() => {
      result.current.addItemToHistory(mockItem);
      result.current.addItemToHistory(mockItem2);
    });

    expect(result.current.driveHistory).toEqual([mockItem2, mockItem]);
  });

  it('should clear the history', () => {
    const { result } = renderHook(() => useDriveInfoHistoryLogic());

    act(() => {
      result.current.addItemToHistory(mockItem);
      result.current.clearHistory();
    });

    expect(result.current.driveHistory).toEqual([]);
  });

  it('should remove drive operations that are in progress', () => {
    const { result } = renderHook(() => useDriveInfoHistoryLogic());

    act(() => {
      result.current.addItemToHistory(mockItem);
      result.current.addItemToHistory(mockItem2);
      result.current.removeDriveOperationsInProgress();
    });

    expect(result.current.driveHistory).toEqual([]);
  });

  it('should not exceed the maximum limit of items in the history', () => {
    const MAX_ITEMS = 2;
    const { result } = renderHook(() => useDriveInfoHistoryLogic(MAX_ITEMS));

    act(() => {
      result.current.addItemToHistory(mockItem);
      result.current.addItemToHistory(mockItem2);
      result.current.addItemToHistory(mockItem3);
      result.current.addItemToHistory(mockItem4);
    });

    expect(result.current.driveHistory.length).toBe(MAX_ITEMS);
    expect(result.current.driveHistory).toEqual([mockItem4, mockItem3]);
  });

  it('should handle adding duplicate items', () => {
    const { result } = renderHook(() => useDriveInfoHistoryLogic());

    act(() => {
      result.current.addItemToHistory(mockItem);
      result.current.addItemToHistory(mockItem);
    });

    expect(result.current.driveHistory).toEqual([mockItem]);
  });
});
