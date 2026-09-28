import { fireEvent, render, screen } from '@testing-library/react';
import type { SyncIssue } from '@/apps/main/background-processes/issues';
import { partialSpyOn } from '@/tests/vitest/partial-spy-on.helper';
import * as useGetUsageModule from '../../api/use-get-usage';
import * as useIssuesModule from '../../hooks/useIssues';
import * as useNetworkRetryModule from '../../hooks/useNetworkRetry';
import { useIssuesStore } from '../Issues/issues-store';
import SyncAction from './SyncAction';

describe('sync-action', () => {
  const useIssuesMock = partialSpyOn(useIssuesModule, 'useIssues');
  const useNetworkRetryMock = partialSpyOn(useNetworkRetryModule, 'useNetworkRetry');
  const useGetUsageMock = partialSpyOn(useGetUsageModule, 'useGetUsage');

  function mockSyncIssues(syncIssues: Array<Omit<SyncIssue, 'tab'>>) {
    useIssuesMock.mockReturnValue({ syncIssues: syncIssues.map((issue) => ({ tab: 'sync', ...issue })) });
  }

  beforeEach(() => {
    useNetworkRetryMock.mockReturnValue({ isOnline: true });
    useGetUsageMock.mockReturnValue({ status: 'loading' });
    useIssuesStore.setState({ activeSection: null });
    mockSyncIssues([]);
  });

  it('should show fully synced when there are no files pending to upload', () => {
    // Given
    mockSyncIssues([{ name: '/big.mp4', error: 'FILE_SIZE_TOO_BIG' }]);
    // When
    render(<SyncAction syncStatus="SYNCED" />);
    // Then
    expect(screen.getByText('Fully synced')).toBeInTheDocument();
  });

  it('should show one file not uploaded', () => {
    // Given
    mockSyncIssues([{ name: '/file.mp4', error: 'UPLOAD_FAILED' }]);
    // When
    render(<SyncAction syncStatus="SYNCED" />);
    // Then
    expect(screen.getByText('1 file not uploaded')).toBeInTheDocument();
  });

  it('should count the files that failed and the files that were not ready', () => {
    // Given
    mockSyncIssues([
      { name: '/a.mp4', error: 'UPLOAD_FAILED' },
      { name: '/b.mp4', error: 'FILE_NOT_READY' },
    ]);
    // When
    render(<SyncAction syncStatus="SYNCED" />);
    // Then
    expect(screen.getByText('2 files not uploaded')).toBeInTheDocument();
  });

  it('should open the sync issues when clicked', () => {
    // Given
    mockSyncIssues([{ name: '/file.mp4', error: 'UPLOAD_FAILED' }]);
    render(<SyncAction syncStatus="SYNCED" />);
    // When
    fireEvent.click(screen.getByText('1 file not uploaded'));
    // Then
    expect(useIssuesStore.getState().activeSection).toBe('virtualDrive');
  });

  it('should keep showing that the sync failed', () => {
    // Given
    mockSyncIssues([{ name: '/file.mp4', error: 'UPLOAD_FAILED' }]);
    // When
    render(<SyncAction syncStatus="SYNC_FAILED" />);
    // Then
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
    expect(screen.queryByText('1 file not uploaded')).not.toBeInTheDocument();
  });
});
