import { useState } from 'react';
import { SyncIssue } from '../../../workers/sync';
import WindowTopBar from '../../components/WindowTopBar';
import useSyncIssues from '../../hooks/SyncIssues';
import SyncIssuesList from './List';
import { ReportModal } from './ReportModal';

export default function Index() {
  const syncIssues = useSyncIssues();
  const [reportData, setReportData] = useState<Pick<
    SyncIssue,
    'errorName' | 'errorDetails'
  > | null>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-l-neutral-10">
      <WindowTopBar title="Sync issues" />
      <div className="draggable flex flex-grow-0 items-center justify-between pt-4 pr-3 pl-4">
        <p className="text-sm font-medium text-gray-80">
          {syncIssues.length ? `${syncIssues.length} issues` : 'No issues'}
        </p>
        <button
          type="button"
          className="non-draggable cursor-pointer rounded-md bg-l-neutral-30 py-1 px-3 text-xs font-semibold text-gray-80 hover:bg-l-neutral-40 active:bg-l-neutral-50"
          onClick={window.electron.openLogs}
        >
          Open log
        </button>
      </div>
      <SyncIssuesList
        syncIssues={syncIssues}
        onClickOnErrorInfo={setReportData}
      />
      <ReportModal
        key={reportData?.errorName}
        data={reportData}
        onClose={() => setReportData(null)}
      />
    </div>
  );
}
