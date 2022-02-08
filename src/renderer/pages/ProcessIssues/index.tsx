import { motion } from 'framer-motion';
import { useState } from 'react';
import { ProcessIssue } from '../../../workers/types';
import WindowTopBar from '../../components/WindowTopBar';
import useProcessIssues from '../../hooks/ProcessIssues';
import ProcessIssuesList from './List';
import { ReportModal } from './ReportModal';

type Section = 'SYNC' | 'BACKUPS';

export default function ProcessIssues() {
  const processIssues = useProcessIssues();
  const [reportData, setReportData] = useState<Pick<
    ProcessIssue,
    'errorName' | 'errorDetails'
  > | null>(null);

  const [activeSection, setActiveSection] = useState<Section>('SYNC');

  const processIssuesFilteredByActiveSection = processIssues.filter(
    (issue) => issue.process === activeSection
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-l-neutral-10">
      <WindowTopBar title="Issues" />
      <div className="draggable flex flex-grow-0 items-center justify-center pt-4">
        <Tabs active={activeSection} onClick={setActiveSection} />
      </div>
      <ProcessIssuesList
        processIssues={processIssuesFilteredByActiveSection}
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

function Tabs({
  active,
  onClick,
}: {
  active: Section;
  onClick: (section: Section) => void;
}) {
  return (
    <div className="non-draggable relative flex h-9 w-48 rounded-lg bg-l-neutral-30">
      <motion.div
        variants={{
          SYNC: { left: 2, right: 'unset' },
          BACKUPS: { right: 2, left: 'unset' },
        }}
        animate={active}
        transition={{ ease: 'easeOut' }}
        className="absolute top-1/2 h-8 -translate-y-1/2 rounded-lg bg-white"
        style={{ width: '6rem' }}
      />
      <button
        type="button"
        onClick={() => onClick('SYNC')}
        className={`relative w-1/2 ${
          active === 'SYNC' ? 'text-neutral-500' : 'text-m-neutral-300'
        }`}
      >
        Sync
      </button>
      <button
        type="button"
        onClick={() => onClick('BACKUPS')}
        className={`relative w-1/2 ${
          active === 'BACKUPS' ? 'text-neutral-500' : 'text-m-neutral-80'
        }`}
      >
        Backups
      </button>
    </div>
  );
}
