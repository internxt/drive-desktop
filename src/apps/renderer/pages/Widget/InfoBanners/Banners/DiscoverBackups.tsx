import Button from '../../../../components/Button';
import { X } from '@phosphor-icons/react';
import Illustration from '../../../../assets/backups/Illustration.svg';
import { useDiscoverBackups } from '../../../../hooks/backups/useDiscoverBackups';
import { useTranslationContext } from '../../../../context/LocalContext';

export function DiscoverBackups() {
  const { hasDiscovered, discover } = useDiscoverBackups();

  if (!hasDiscovered) {
    return <></>;
  }

  const openBackupsSettings = () =>
    window.electron.openSettingsWindow('BACKUPS');

  const { translate } = useTranslationContext();

  return (
    <div className="m-3 grid grid-cols-2 gap-3 rounded-lg border border-gray-30 bg-gray-5 p-4 ">
      <figure className="-m-4 mr-0">
        <Illustration />
      </figure>
      <div className="flex flex-col">
        <div className="flex flex-row">
          <div>
            <div className="text-neutral-500 text-sm  font-semibold">
              {translate('widget.banners.discover-backups.title')}
            </div>
            <div className="mb-4 mt-1 text-xs">
              {translate('widget.banners.discover-backups.body')}
            </div>
          </div>
          <X
            size={50}
            className="-mt-3  hover:cursor-pointer"
            onClick={discover}
          />
        </div>
        <Button size="sm" className="mt-auto" onClick={openBackupsSettings}>
          <span className="text-xs">
            {translate('widget.banners.discover-backups.action')}
          </span>
        </Button>
      </div>
    </div>
  );
}
