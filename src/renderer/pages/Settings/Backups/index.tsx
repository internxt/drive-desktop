import { useState } from 'react';
import BackupsList from './List';
import BackupsPanel from './Panel';

export default function BackupsSection({ active }: { active: boolean }) {
  const [subsection, setSubsection] = useState<'panel' | 'list'>('panel');

  return (
    <div className={active ? 'block' : 'hidden'}>
      {subsection === 'panel' && (
        <BackupsPanel onGoToList={() => setSubsection('list')} />
      )}
      {subsection === 'list' && (
        <BackupsList onGoToPanel={() => setSubsection('panel')} />
      )}
    </div>
  );
}
