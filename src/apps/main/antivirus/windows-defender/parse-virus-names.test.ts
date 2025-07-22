import { parseVirusNames } from './parse-virus-names';

describe('parseVirusNames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts virus names from pattern "Threat detected: VirusName"', () => {
    // Given
    const stdout = 'Scanning file... Threat detected: TestVirus1';
    const stderr = '';
    const stdoutWithCode = stdout + '\nWarning: MpScan() encounter error. hr = 0x80508023';
    // When
    const result = parseVirusNames({ stdout: stdoutWithCode, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus1']);
  });

  it('extracts virus names from pattern "Threat VirusName was detected"', () => {
    // Given
    const stdout = 'Scanning file... Threat TestVirus2 was detected';
    const stderr = '';
    const stdoutWithCode = stdout + '\nERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023';
    // When
    const result = parseVirusNames({ stdout: stdoutWithCode, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus2']);
  });

  it('extracts virus names from pattern "Found VirusName threat"', () => {
    // Given
    const stdout = 'Scanning file... Found TestVirus3 threat\nMpCmdRun.exe: hr = 0x80508007.';
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus3']);
  });

  it('extracts virus names from pattern "Malware VirusName detected"', () => {
    // Given
    const stdout = 'Scanning file... Malware TestVirus4 detected';
    const stderr = 'Warning: MpScan() encounter error. hr = 0x80508007';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus4']);
  });

  it('extracts virus names from pattern "Virus VirusName found"', () => {
    // Given
    const stdout = 'Scanning file... Virus TestVirus5 found\nERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023';
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus5']);
  });

  it('extracts virus names from pattern "Infected with VirusName"', () => {
    // Given
    const stdout = 'Scanning file... Infected with TestVirus6';
    const stderr = '';
    const stdoutWithCode = stdout + '\nMpCmdRun.exe: hr = 0x80508007.';
    // When
    const result = parseVirusNames({ stdout: stdoutWithCode, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus6']);
  });

  it('combines output from stdout and stderr', () => {
    // Given
    const stdout = 'Scanning file... Virus TestVirus7 found\nMpCmdRun.exe: hr = 0x80508023.';
    const stderr = 'Error: Threat TestVirus8 was detected';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toContain('TestVirus7');
    expect(result).toContain('TestVirus8');
  });

  it('removes duplicates', () => {
    // Given
    const stdout =
      'Scanning file... Virus TestVirus9 found. Another instance: Virus TestVirus9 found\nWarning: MpScan() encounter error. hr = 0x80508023';
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus9']);
  });

  it('cleans up virus names by removing quotes and file: prefix', () => {
    // Given
    const stdout = 'Scanning file... Virus file:TestVirus10 found\nMpCmdRun.exe: hr = 0x80508007.';
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['TestVirus10']);
  });

  it('returns default threat name if no virus names are found', () => {
    // Given
    const stdout =
      'Scanning file... Something detected but no pattern match\nERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023';
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['Windows.Defender.Threat.Detected']);
  });

  it('handles real Windows Defender output with EICAR test file', () => {
    // Given
    const stdout = `-------------------------------------------------------------------------------
MpCmdRun: Command Line: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.25050.5-0\\MpCmdRun.exe" -Scan -ScanType 3 -DisableRemediation -File C:/Users/Esteban/Desktop/eicar.com.txt
Start Time: mar. jul. 15 2025 10:11:20

MpEnsureProcessMitigationPolicy(0x5): hr = 0x1
Starting RunCommandScan.
INFO: ScheduleJob is not set. Skipping signature update.
Scanning path as file: C:/Users/Esteban/Desktop/eicar.com.txt.
Start: MpScan(MP_FEATURE_SUPPORTED, dwOptions=1107300385, path C:/Users/Esteban/Desktop/eicar.com.txt, DisableRemediation = 1, BootSectorScan = 0, Timeout in days = 1)
MpScan() started
Warning: MpScan() encounter error. hr = 0x80508023
MpScan() was completed
ERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023
MpCmdRun.exe: hr = 0x80508023.
MpCmdRun: End Time: mar. jul. 15 2025 10:11:20
-------------------------------------------------------------------------------`;
    const stderr = '';
    // When
    const result = parseVirusNames({ stdout, stderr });
    // Then
    expect(result).toStrictEqual(['Windows.Defender.Threat.Detected']);
  });
});
