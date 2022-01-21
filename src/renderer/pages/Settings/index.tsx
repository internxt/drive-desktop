import { useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import Header, { Section } from './Header';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <WindowTopBar title="Internxt Drive" />
      <Header active={activeSection} onClick={setActiveSection} />
    </div>
  );
}
