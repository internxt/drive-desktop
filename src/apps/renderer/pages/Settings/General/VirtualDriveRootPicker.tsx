import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import useVirtualDriveRootPicker from './useVirtualDriveRootPicker';

export default function VirtualDriveRootPicker() {
  const { translate } = useTranslationContext();
  const { rootPath, isUpdating, onChooseFolder } = useVirtualDriveRootPicker();

  return (
    <div className="flex w-full flex-col space-y-2">
      <p className="text-sm font-medium leading-4 text-gray-80">
        {translate('settings.general.virtual-drive-root.label')}
      </p>

      <div className="flex w-full items-center space-x-3">
        <div className="flex h-9 flex-1 items-center rounded-md border border-gray-10 bg-gray-1 px-3 dark:border-gray-20 dark:bg-gray-5">
          <p className="w-full truncate text-sm leading-4 text-gray-100 dark:text-gray-80" title={rootPath}>
            {rootPath}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={onChooseFolder} disabled={isUpdating}>
          {translate('settings.general.virtual-drive-root.action')}
        </Button>
      </div>
    </div>
  );
}
