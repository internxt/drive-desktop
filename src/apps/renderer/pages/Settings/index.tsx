import { useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import BackupsSection from './Backups';
import Header from './Header';
import { DeviceProvider } from '../../context/DeviceContext';
import { BackupProvider } from '../../context/BackupContext';
import BackupFolderSelector from './Backups/Selector/BackupFolderSelector';
import DownloadFolderSelector from './Backups/Selector/DownloadSelector';
import AntivirusSection from './Antivirus';
import { RemoveMalwareState } from './Antivirus/views/RemoveMalwareState';
import { AntivirusProvider } from '../../context/AntivirusContext';
import { CleanerModule } from '@internxt/drive-desktop-core/build/frontend';
import { CleanerProvider } from '../../context/cleaner-context';
import { useCleaner } from './cleaner/context/use-cleaner';
import { sectionConfig } from './cleaner/cleaner.config';
import { useGetAvailableProducts } from '../../api/use-get-available-products';
import { useI18n } from '../../localize/use-i18n';
import { Section, useSettingsStore } from './settings-store';

export const SHOW_ANTIVIRUS_TOOL = true;

type Props = {
  activeSection: Section;
};

export default function Settings({ activeSection }: Props) {
  const { setActiveSection } = useSettingsStore();
  const [subsection, setSubsection] = useState<'panel' | 'list' | 'download_list'>('panel');
  const { data: availableProducts, isLoading: isAvailableProductsLoading } = useGetAvailableProducts();

  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <DeviceProvider>
      <BackupProvider>
        <AntivirusProvider>
          <CleanerProvider>
            <div
              className="flex flex-col rounded bg-gray-1"
              ref={rootRef}
              style={{
                minWidth: subsection === 'list' ? 'auto' : 400,
                minHeight: subsection === 'list' ? 'auto' : 420,
              }}>
              {subsection === 'list' && activeSection === 'BACKUPS' && <BackupFolderSelector onClose={() => setSubsection('panel')} />}
              {subsection === 'download_list' && <DownloadFolderSelector onClose={() => setSubsection('panel')} />}
              {SHOW_ANTIVIRUS_TOOL && subsection === 'list' && activeSection === 'ANTIVIRUS' && (
                <RemoveMalwareState onCancel={() => setSubsection('panel')} />
              )}
              {subsection === 'panel' && (
                <>
                  <WindowTopBar title="Internxt" className="bg-surface dark:bg-gray-5" onClose={() => setActiveSection(null)} />
                  <Header active={activeSection} onClick={setActiveSection} />
                  <div className="flex flex-grow flex-col justify-center p-5">
                    <GeneralSection active={activeSection === 'GENERAL'} data-automation-id="itemSettingsGeneral" />
                    <AccountSection active={activeSection === 'ACCOUNT'} data-automation-id="itemSettingsAccount" />
                    <BackupsSection
                      active={activeSection === 'BACKUPS'}
                      isAvailable={Boolean(availableProducts?.backups)}
                      isSectionLoading={isAvailableProductsLoading}
                      showBackedFolders={() => setSubsection('list')}
                      showDownloadFolers={() => setSubsection('download_list')}
                      data-automation-id="itemSettingsBackups"
                    />
                    {SHOW_ANTIVIRUS_TOOL && (
                      <AntivirusSection
                        onCancelDeactivateWinDefender={() => setActiveSection('GENERAL')}
                        active={activeSection === 'ANTIVIRUS'}
                        showItemsWithMalware={() => setSubsection('list')}
                        data-automation-id="itemSettingsAntivirus"
                      />
                    )}
                    <CleanerModule.CleanerSection
                      active={activeSection === 'CLEANER'}
                      isAvailable={Boolean(availableProducts?.cleaner)}
                      isSectionLoading={isAvailableProductsLoading}
                      data-automation-id="itemSettingsCleaner"
                      useCleaner={useCleaner}
                      useTranslationContext={useI18n}
                      openUrl={window.electron.shellOpenExternal}
                      sectionConfig={sectionConfig}
                    />
                  </div>
                </>
              )}
            </div>
          </CleanerProvider>
        </AntivirusProvider>
      </BackupProvider>
    </DeviceProvider>
  );
}
