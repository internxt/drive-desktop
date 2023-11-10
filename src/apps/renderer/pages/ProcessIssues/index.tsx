import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { ProcessIssue } from '../../../workers/types';
import WindowTopBar from '../../components/WindowTopBar';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useGeneralIssues from '../../hooks/GeneralIssues';
import useProcessIssues from '../../hooks/ProcessIssues';
import ProcessIssuesList from './List';
import { ReportModal } from './ReportModal';

type Section = 'SYNC' | 'GENERAL';

export default function ProcessIssues() {
  const { translate } = useTranslationContext();
  const processIssues = useProcessIssues();
  const generalIssues = useGeneralIssues();
  const { backupFatalErrors } = useBackupFatalErrors();
  const [reportData, setReportData] = useState<Pick<
    ProcessIssue,
    'errorName'
  > | null>(null);

  const [activeSection, setActiveSection] = useState<Section>('SYNC');

  const processIssuesFilteredByActiveSection = processIssues.filter(
    (issue) => issue.process === activeSection
  );

  useEffect(() => {
    if (
      activeSection === 'SYNC' &&
      processIssuesFilteredByActiveSection.length === 0 &&
      generalIssues.length
    ) {
      setActiveSection('GENERAL');
    } else if (
      processIssuesFilteredByActiveSection.length === 0 &&
      backupFatalErrors.length === 0 &&
      processIssues.length
    ) {
      setActiveSection('SYNC');
    }
  }, [processIssues, backupFatalErrors, generalIssues]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WindowTopBar title={translate('issues.title')} />

      <div className="draggable flex items-center justify-center py-2">
        <Tabs active={activeSection} onChangeTab={setActiveSection} />
      </div>

      <ProcessIssuesList
        selectedTab={activeSection}
        showBackupFatalErrors={false}
        backupFatalErrors={backupFatalErrors}
        generalIssues={generalIssues}
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
  onChangeTab,
}: {
  active: Section;
  onChangeTab: (section: Section) => void;
}) {
  const { translate, language } = useTranslationContext();
  const [tabsWidth, setTabsWidth] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    setTabsWidth([
      (document.querySelector('#tab-SYNC') as HTMLElement).offsetWidth,
      (document.querySelector('#tab-GENERAL') as HTMLElement).offsetWidth,
    ]);
  }, [language, active]);

  const tabs: { value: Section; name: string }[] = [
    {
      value: 'SYNC',
      name: translate('issues.tabs.sync'),
    },
    {
      value: 'GENERAL',
      name: translate('issues.tabs.general'),
    },
  ];

  const Tab = ({ value, name }: { value: Section; name: string }) => (
    <li
      id={`tab-${value}`}
      onClick={() => onChangeTab(value)}
      className={`relative flex cursor-pointer items-center px-4 transition-colors duration-200 ease-out ${
        active === value ? 'text-gray-100' : 'text-gray-60'
      }`}
    >
      {name}
    </li>
  );

  return (
    <div className="non-draggable flex h-10 items-stretch rounded-xl bg-gray-5 p-1">
      <div className="relative flex items-stretch">
        <motion.div
          variants={{
            SYNC: { left: 0, right: 'unset', width: tabsWidth[0] },
            GENERAL: {
              left: tabsWidth[0],
              right: 'unset',
              width: tabsWidth[1],
            },
          }}
          animate={active}
          transition={{ ease: 'easeOut', duration: 0.2 }}
          className="absolute h-full rounded-lg bg-surface shadow dark:bg-gray-20"
          style={{ width: tabsWidth[0] }}
        />

        {tabs.map((tab) => (
          <Tab {...tab} />
        ))}
      </div>
    </div>
  );
}
