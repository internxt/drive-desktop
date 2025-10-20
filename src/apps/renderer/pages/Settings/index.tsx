import { useEffect, useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import BackupsSection from './Backups';
import Header, { Section } from './Header';
import { DeviceProvider } from '../../context/DeviceContext';
import { BackupProvider } from '../../context/BackupContext';
import BackupFolderSelector from './Backups/Selector/BackupFolderSelector';
import DownloadFolderSelector from './Backups/Selector/DownloadSelector';
import AntivirusSection from './Antivirus';
import { RemoveMalwareState } from './Antivirus/views/RemoveMalwareState';
import { AntivirusProvider } from '../../context/AntivirusContext';
import { CleanerModule } from '@internxt/drive-desktop-core/build/frontend';
import { CleanerProvider } from '../../context/cleaner-context';
import { useTranslationContext } from '../../context/LocalContext';
import { useCleaner } from './cleaner/context/use-cleaner';
import { sectionConfig } from './cleaner/cleaner.config';
import { useGetAvailableProducts } from '../../api/use-get-available-products';

export const SHOW_ANTIVIRUS_TOOL = true;

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');
  const [subsection, setSubsection] = useState<'panel' | 'list' | 'download_list'>('panel');
  const { data: availableProducts, isLoading: isAvailableProductsLoading } = useGetAvailableProducts();

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([rootElement]) =>
      window.electron.settingsWindowResized({
        width: rootElement.borderBoxSize[0].inlineSize,
        height: rootElement.borderBoxSize[0].blockSize,
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resizeObserver.observe(rootRef.current!);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    if (section && ['BACKUPS', 'GENERAL', 'ACCOUNT', 'ANTIVIRUS', 'CLEANER'].includes(section)) {
      setActiveSection(section as Section);
    }
  }, []);

  return (
    <DeviceProvider>
      <BackupProvider>
        <AntivirusProvider>
          <CleanerProvider>
            <div
              className="flex flex-col bg-gray-1"
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
                  <WindowTopBar title="Internxt" className="bg-surface dark:bg-gray-5" />
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
                      showIssues={() => window.electron.openProcessIssuesWindow()}
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
                      useTranslationContext={useTranslationContext}
                      openUrl={window.electron.openUrl}
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
