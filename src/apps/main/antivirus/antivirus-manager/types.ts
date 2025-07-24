import { AntivirusClamAV } from '../antivirus-clam-av';
import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';

export type AntivirusType = 'windows-defender' | 'clamav';
export type AntivirusEngine = AntivirusClamAV | AntivirusWindowsDefender;
