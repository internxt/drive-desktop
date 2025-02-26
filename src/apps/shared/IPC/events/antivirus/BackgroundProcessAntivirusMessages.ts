import { SelectedItemToScanProps } from '../../../../main/antivirus/Antivirus';

export type BackgroundProcessAntivirusMessages = {
  'antivirus:scan-items': (items: SelectedItemToScanProps[]) => Promise<void>;
};
