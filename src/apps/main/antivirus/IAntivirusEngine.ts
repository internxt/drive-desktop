/**
 * Interface that defines the basic contract for the current antivirus
 * Covers only the functionalities that already exist in the implementation
 *
 * Note: Classes implementing this interface should also provide a static method:
 * static createInstance(): Promise<IAntivirusEngine>
 */
export interface IAntivirusEngine {
  /**
   * Initializes the antivirus engine
   */
  initialize(): Promise<void>;

  /**
   * Scans a specific file for threats
   * @param filePath Path to the file to scan
   * @returns Scan result with information about infection and threats
   */
  scanFile(filePath: string): Promise<ScanResult>;

  /**
   * Stops the antivirus engine and releases resources
   */
  stop(): Promise<void>;
}

/**
 * Result of scanning a file
 */
export interface ScanResult {
  /** Path to the file that was scanned */
  file: string;
  /** Indicates if the file is infected */
  isInfected: boolean;
  /** Array with the names of threats found (empty if no threats) */
  viruses: string[];
}

/**
 * Interface for items to be scanned
 */
export interface SelectedItemToScanProps {
  path: string;
  itemName: string;
  isDirectory: boolean;
}
