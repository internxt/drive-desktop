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

type Section = 'SYNC' | 'BACKUPS' | 'GENERAL';

export default function ProcessIssues() {
	const { translate } = useTranslationContext();
	const processIssues = useProcessIssues();
	const generalIssues = useGeneralIssues();
	const backupFatalErrors = useBackupFatalErrors();
	const [reportData, setReportData] = useState<Pick<
		ProcessIssue,
		'errorName' | 'errorDetails'
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
			activeSection === 'SYNC' &&
			processIssuesFilteredByActiveSection.length === 0 &&
			(backupFatalErrors.length || processIssues.length)
		) {
			setActiveSection('BACKUPS');
		} else if (
			activeSection === 'BACKUPS' &&
			processIssuesFilteredByActiveSection.length === 0 &&
			backupFatalErrors.length === 0 &&
			processIssues.length
		) {
			setActiveSection('SYNC');
		}
	}, [processIssues, backupFatalErrors, generalIssues]);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-l-neutral-10">
			<WindowTopBar title={translate('issues.title')} />
			<div className="draggable flex flex-shrink-0 flex-grow-0 items-center justify-center pt-4">
				<Tabs active={activeSection} onClick={setActiveSection} />
			</div>
			<ProcessIssuesList
				selectedTab={activeSection}
				showBackupFatalErrors={activeSection === 'BACKUPS'}
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

function Tabs({ active, onClick }: { active: Section; onClick: (section: Section) => void }) {
	const { translate, language } = useTranslationContext();
	const [tabsWidth, setTabsWidth] = useState<Array<number>>([
		(64 * 4) / 3,
		(64 * 4) / 3,
		(64 * 4) / 3,
	]);

	const w = language === 'es' || language === 'fr' ? 'w-11/12' : 'w-64';

	useEffect(() => {
		const fullWidth = language === 'en' ? 64 : 100;

		const eventTabsWith = (fullWidth * 4) / 3;

		if (language === 'en') {
			setTabsWidth([eventTabsWith, eventTabsWith, eventTabsWith]);
		}

		if (language === 'es' || language === 'fr') {
			setTabsWidth([eventTabsWith, eventTabsWith + 60, eventTabsWith]);
		}
	}, [language, active]);

	return (
		<div className={`non-draggable relative flex h-9 rounded-lg bg-l-neutral-30 ${w}`}>
			<motion.div
				variants={{
					SYNC: { left: 2, right: 'unset', width: tabsWidth[0] },
					BACKUPS: {
						left: tabsWidth[0] + 2,
						right: 'unset',
						width: tabsWidth[1],
					},
					GENERAL: {
						left: tabsWidth[0] + tabsWidth[1] - 4,
						right: 'unset',
						width: tabsWidth[2],
					},
				}}
				animate={active}
				transition={{ ease: 'easeOut' }}
				className="absolute top-1/2 h-8 -translate-y-1/2 rounded-lg bg-white"
				style={{ width: tabsWidth[0] }}
			/>
			<button
				type="button"
				style={{ width: tabsWidth[0] }}
				onClick={() => onClick('SYNC')}
				className={`relative ${active === 'SYNC' ? 'text-neutral-500' : 'text-m-neutral-80'}`}
			>
				{translate('issues.tabs.sync')}
			</button>
			<button
				type="button"
				style={{ width: tabsWidth[1] }}
				onClick={() => onClick('BACKUPS')}
				className={`relative ${active === 'BACKUPS' ? 'text-neutral-500' : 'text-m-neutral-80'}`}
			>
				{translate('issues.tabs.backups')}
			</button>
			<button
				type="button"
				style={{ width: tabsWidth[2] }}
				onClick={() => onClick('GENERAL')}
				className={`relative ${active === 'GENERAL' ? 'text-neutral-500' : 'text-m-neutral-80'}`}
			>
				{translate('issues.tabs.general')}
			</button>
		</div>
	);
}
