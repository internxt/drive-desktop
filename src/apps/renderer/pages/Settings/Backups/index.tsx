import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import { DeviceSettings } from './DeviceSettings';
import { DevicesList } from './DevicesList';
import { ScrollableContent } from '../../../components/ScrollableContent';
import { BackupContext } from '@/apps/renderer/context/BackupContext';
import { LockedState } from '../Antivirus/views/LockedState';
import { SectionSpinner } from '@internxt/drive-desktop-core/build/frontend';

type Props = {
  active: boolean;
  showBackedFolders: () => void;
  showDownloadFolers: () => void;
  isSectionLoading: boolean;
  isAvailable: boolean;
};

export default function BackupsSection({ active, showBackedFolders, showDownloadFolers, isSectionLoading, isAvailable }: Props) {
  const { deviceState } = useContext(DeviceContext);
  const { existsBackup } = useContext(BackupContext);

  function renderContent() {
    if (isSectionLoading) return <SectionSpinner />;

    if (!isAvailable && !existsBackup) return <LockedState />;

    if (deviceState.status === 'LOADING') return <SectionSpinner />;

    return (
      <>
        {deviceState.status === 'ERROR' && (
          <div className="flex h-32 items-center justify-center">
            <p className="text-red-60 text-sm">There was an error loading your backups</p>
          </div>
        )}
        {deviceState.status === 'SUCCESS' && (
          <section className="flex h-full">
            <DevicesList className="w-1/3" />
            <div className="mx-4 border-l border-gray-10"></div>
            <ScrollableContent className="w-2/3">
              <DeviceSettings onGoToList={showBackedFolders} showDownloadFolers={showDownloadFolers} />
            </ScrollableContent>
          </section>
        )}
      </>
    );
  }

  return <div className={`${active ? 'block' : 'hidden'} w-full`}>{renderContent()}</div>;
}
