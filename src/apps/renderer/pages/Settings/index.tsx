import { useEffect, useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import BackupsSection from './Backups';
import Header, { Section } from './Header';
import { DeviceProvider } from '../../context/DeviceContext';
import { BackupProvider } from '../../context/BackupContext';
import BackupFolderSelector from './Backups/Selector/BackupFolderSelector';
import DownloadFolderSelector from './Backups/Selector/DownloadSelector';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');
  const [subsection, setSubsection] = useState<
    'panel' | 'list' | 'download_list'
  >('panel');

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([rootElement]) =>
      window.electron.settingsWindowResized({
        width: rootElement.borderBoxSize[0].inlineSize,
        height: rootElement.borderBoxSize[0].blockSize,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resizeObserver.observe(rootRef.current!);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    if (section && ['BACKUPS', 'GENERAL', 'ACCOUNT'].includes(section)) {
      setActiveSection(section as Section);
    }
  }, []);

  return (
    <DeviceProvider>
      <BackupProvider>
        <div
          ref={rootRef}
          style={{ minWidth: 400, minHeight: subsection === 'list' ? 0 : 420 }}
        >
          {subsection === 'list' && (
            <BackupFolderSelector onClose={() => setSubsection('panel')} />
          )}
          {subsection === 'download_list' && (
            <DownloadFolderSelector onClose={() => setSubsection('panel')} />
          )}
          {subsection === 'panel' && (
            <>
              <WindowTopBar
                title="Internxt Drive"
                className="bg-surface dark:bg-gray-5"
              />
              <Header active={activeSection} onClick={setActiveSection} />
              <div className={'bg-gray-1 p-5'}>
                <GeneralSection active={activeSection === 'GENERAL'} />
                <AccountSection active={activeSection === 'ACCOUNT'} />
                <BackupsSection
                  active={activeSection === 'BACKUPS'}
                  showBackedFolders={() => setSubsection('list')}
                  showDownloadFolers={() => setSubsection('download_list')}
                  showIssues={() => window.electron.openProcessIssuesWindow()}
                />
              </div>
            </>
          )}
        </div>
      </BackupProvider>
    </DeviceProvider>
  );
}
