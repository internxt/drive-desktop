import { useEffect, useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import Header, { Section } from './Header';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');

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
    <div ref={rootRef}>
      <WindowTopBar
        title="Internxt Drive"
        className="bg-surface dark:bg-gray-5"
      />
      <Header active={activeSection} onClick={setActiveSection} />
      <div className="bg-gray-1 p-5">
        <GeneralSection active={activeSection === 'GENERAL'} />
        <AccountSection active={activeSection === 'ACCOUNT'} />
      </div>
    </div>
  );
}
