import { useEffect, useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import Header, { Section } from './Header';
import BackupsSection from './Backups';
import BackupFolderSelector from './Backups/Selector/BackupFolderSelector';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');
  const [subsection, setSubsection] = useState<'panel' | 'list'>('panel');

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([rootElement]) =>
      window.electron.settingsWindowResized({
        width: rootElement.borderBoxSize[0].inlineSize,
        height: rootElement.borderBoxSize[0].blockSize,
      })
    );

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
    <div
      ref={rootRef}
      style={{ minWidth: 600, minHeight: subsection === 'list' ? 0 : 420 }}
    >
      {subsection === 'list' && (
        <BackupFolderSelector onClose={() => setSubsection('panel')} />
      )}
      {subsection === 'panel' && (
        <div className="flex flex-grow flex-col">
          <WindowTopBar
            title="Internxt Drive"
            className="bg-surface dark:bg-gray-5"
          />
          <Header active={activeSection} onClick={setActiveSection} />
          <div className="flex bg-gray-1 p-5" style={{ minHeight: 420 }}>
            <GeneralSection active={activeSection === 'GENERAL'} />
            <AccountSection active={activeSection === 'ACCOUNT'} />
            <BackupsSection
              active={activeSection === 'BACKUPS'}
              showBackedFolders={() => setSubsection('list')}
            />
          </div>
        </div>
      )}
    </div>
  );
}
