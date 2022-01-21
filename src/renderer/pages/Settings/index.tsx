import { useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import GeneralSection from './General';
import Header, { Section } from './Header';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <WindowTopBar title="Internxt Drive" />
      <Header active={activeSection} onClick={setActiveSection} />
      <div className="bg-l-neutral-10 flex-grow border-t border-t-l-neutral-30 p-8">
        {activeSection === 'GENERAL' && <GeneralSection />}
      </div>
    </div>
  );
}
