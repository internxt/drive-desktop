import { SelectedItemToScanProps } from '../../../../main/antivirus/Antivirus';

export type MainProcessAntivirusMessages = {
  'antivirus:is-available': () => Promise<boolean>;
  'antivirus:cancel-scan': () => Promise<void>;
  'antivirus:scan-items': (items: SelectedItemToScanProps[]) => Promise<void>;
  'antivirus:add-items-to-scan': (getFiles: boolean) => Promise<void>;
  'antivirus:remove-infected-files': (files: string[]) => Promise<void>;
};
