import { CleanerSection, ExtendedCleanerReport } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

type CleanerReport = {
  windowsSpecific: CleanerSection;
};

export type WindowsCleanerReport = ExtendedCleanerReport<CleanerReport>;
