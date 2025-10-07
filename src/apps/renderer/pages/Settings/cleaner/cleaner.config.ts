import { CleanerSectionKey } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';
import { SectionConfig } from '@internxt/drive-desktop-core/build/frontend/features/cleaner/cleaner.types';

export const cleanerSectionKeys: CleanerSectionKey[] = ['appCache', 'logFiles', 'trash', 'webCache', 'webStorage', 'platformSpecific'];

export const sectionConfig: SectionConfig = {
  appCache: { name: 'App Cache', color: '#3B82F6' },
  logFiles: { name: 'Log Files', color: '#10B981' },
  trash: { name: 'Trash', color: '#F59E0B' },
  webStorage: { name: 'Web Storage', color: '#EF4444' },
  webCache: { name: 'Web Cache', color: '#8B5CF6' },
  platformSpecific: { name: 'Windows Specific', color: '#69ed28ff' },
};
