import { useState } from 'react';
import { ProcessIssue } from '../../../workers/types';
import WindowTopBar from '../../components/WindowTopBar';
import useProcessIssues from '../../hooks/ProcessIssues';
import ProcessIssuesList from './List';
import { ReportModal } from './ReportModal';

export default function ProcessIssues() {
  const processIssues = useProcessIssues();
  const [reportData, setReportData] = useState<Pick<
    ProcessIssue,
    'errorName' | 'errorDetails'
  > | null>(null);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-l-neutral-10">
      <WindowTopBar title="Issues" />
      <div className="draggable flex flex-grow-0 items-center justify-between pt-4 pr-3 pl-4">
        <p className="text-sm font-medium text-gray-80">
          {processIssues.length
            ? `${processIssues.length} issues`
            : 'No issues'}
        </p>
        <button
          type="button"
          className="non-draggable cursor-pointer rounded-md bg-l-neutral-30 py-1 px-3 text-xs font-semibold text-gray-80 hover:bg-l-neutral-40 active:bg-l-neutral-50"
          onClick={window.electron.openLogs}
        >
          Open log
        </button>
      </div>
      <ProcessIssuesList
        processIssues={processIssues}
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
