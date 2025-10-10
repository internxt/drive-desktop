import { CleanerSectionKey } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { SectionConfig } from '@internxt/drive-desktop-core/build/frontend/features/cleaner/cleaner.types';

export const cleanerSectionKeys: CleanerSectionKey[] = ['appCache', 'logFiles', 'webCache', 'webStorage', 'platformSpecific'];

export const sectionConfig: SectionConfig = {
  appCache: { name: 'App Cache', color: '#3384FF' },
  logFiles: { name: 'Log Files', color: '#5BCF77' },
  webStorage: { name: 'Web Storage', color: '#FF3D33' },
  webCache: { name: 'Web Cache', color: '#7371DC' },
  platformSpecific: { name: 'Windows Specific', color: '#33CEC1' },
} as Partial<SectionConfig> as SectionConfig;
