import { ReactNode, useContext, useState } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import Spinner from '../../../assets/spinner.svg';
import BackupsList from './List';
import BackupsPanel from './Panel';

export default function BackupsSection({ active }: { active: boolean }) {
  const [subsection, setSubsection] = useState<'panel' | 'list'>('panel');

  const [deviceState] = useContext(DeviceContext);

  let content: ReactNode;

  if (deviceState.status === 'LOADING')
    content = (
      <div className="flex h-32 items-center justify-center">
        <Spinner className=" h-9 w-9 animate-spin fill-neutral-500" />
      </div>
    );
  else if (deviceState.status === 'ERROR')
    content = (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-red-60">
          There was an error loading your backups
        </p>
      </div>
    );
  else
    content = (
      <>
        {subsection === 'panel' && (
          <BackupsPanel onGoToList={() => setSubsection('list')} />
        )}
        {subsection === 'list' && (
          <BackupsList onGoToPanel={() => setSubsection('panel')} />
        )}
      </>
    );

  return <div className={active ? 'block' : 'hidden'}>{content}</div>;
}
