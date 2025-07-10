/**
 * Types related to Windows Defender antivirus scanning
 */

export interface ScanResult {
  /** Path to the file that was scanned */
  file: string;
  /** Indicates if the file is infected */
  isInfected: boolean;
  /** Array with the names of threats found (empty if no threats) */
  viruses: string[];
}
