import { type FC } from 'react';
import { DevicesList } from '../DevicesList/DevicesList';
import { ScrollableContent } from '../../../../components/ScrollableContent';
import { DeviceSettings } from '../DeviceSettings';

interface Props {
  showBackedFolders: () => void;
  showIssues: () => void;
}

const DeviceBackupsDetailsView: FC<Props> = ({ showBackedFolders, showIssues }) => {
  return (
    <>
      <DevicesList className="w-1/3" />
      <div className="mx-4 border-l border-gray-10"></div>
      <ScrollableContent className="w-2/3">
        <DeviceSettings
          onGoToList={showBackedFolders}
          showIssues={showIssues}
        />
      </ScrollableContent>
    </>
  );
};

export default DeviceBackupsDetailsView;
