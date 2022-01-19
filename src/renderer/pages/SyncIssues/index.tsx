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
    <div className="h-screen overflow-hidden flex flex-col">
      <WindowTopBar title="Sync issues" />
      <div className="flex justify-between items-center pt-4 pr-3 pl-4 flex-grow-0 draggable">
        <p className="font-medium text-gray-80 text-sm">
          {syncIssues.length ? `${syncIssues.length} issues` : 'No issues'}
        </p>
        <button
          type="button"
          className="text-gray-80 bg-l-neutral-30 hover:bg-l-neutral-40 active:bg-l-neutral-50 rounded-md font-semibold cursor-pointer non-draggable text-xs py-1 px-3"
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
