import { describe, expect, it } from 'vitest';
import { extractVirusNamesFromOutput } from './extract-virus-names';

describe('extractVirusNamesFromOutput', () => {
  it('extracts virus names from pattern "Threat detected: VirusName"', () => {
    // Given
    const output = 'Scanning file... Threat detected: TestVirus1';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus1']);
  });

  it('extracts virus names from pattern "Threat VirusName was detected"', () => {
    // Given
    const output = 'Scanning file... Threat TestVirus2 was detected';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus2']);
  });

  it('extracts virus names from pattern "Found VirusName threat"', () => {
    // Given
    const output = 'Scanning file... Found TestVirus3 threat';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus3']);
  });

  it('extracts virus names from pattern "Malware VirusName detected"', () => {
    // Given
    const output = 'Scanning file... Malware TestVirus4 detected';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus4']);
  });

  it('extracts virus names from pattern "Virus VirusName found"', () => {
    // Given
    const output = 'Scanning file... Virus TestVirus5 found';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus5']);
  });

  it('extracts virus names from pattern "Infected with VirusName"', () => {
    // Given
    const output = 'Scanning file... Infected with TestVirus6';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus6']);
  });

  it('removes duplicates', () => {
    // Given
    const output = 'Scanning file... Virus TestVirus7 found. Another instance: Virus TestVirus7 found';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus7']);
  });

  it('cleans up virus names by removing quotes and file: prefix', () => {
    // Given
    const output = 'Scanning file... Virus file:TestVirus8 found';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['TestVirus8']);
  });

  it('handles multiple different viruses in the same output', () => {
    // Given
    const output = 'Scanning file... Virus TestVirus9 found. Also, Threat detected: TestVirus10';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toContain('TestVirus9');
    expect(result).toContain('TestVirus10');
    expect(result.length).toBe(2);
  });

  it('returns empty array when no virus names are found', () => {
    // Given
    const output = 'Scanning file... No threats found.';

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual([]);
  });

  it('handles real Windows Defender output with EICAR test file', () => {
    // Given
    const output = `-------------------------------------------------------------------------------
MpCmdRun: Command Line: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.25050.5-0\\MpCmdRun.exe" -Scan -ScanType 3 -DisableRemediation -File C:/Users/example/Desktop/eicar.com.txt
Start Time: mar. jul. 15 2025 10:11:20

MpEnsureProcessMitigationPolicy(0x5): hr = 0x1
Starting RunCommandScan.
INFO: ScheduleJob is not set. Skipping signature update.
Scanning path as file: C:/Users/example/Desktop/eicar.com.txt.
Start: MpScan(MP_FEATURE_SUPPORTED, dwOptions=1107300385, path C:/Users/example/Desktop/eicar.com.txt, DisableRemediation = 1, BootSectorScan = 0, Timeout in days = 1)
MpScan() started
Warning: MpScan() encounter error. hr = 0x80508023
MpScan() was completed
ERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023
MpCmdRun.exe: hr = 0x80508023.
MpCmdRun: End Time: mar. jul. 15 2025 10:11:20
-------------------------------------------------------------------------------`;

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then - Since no specific virus name is found, the function should return an empty array
    // The parseVirusNames function will then convert this to a generic threat name
    expect(result).toEqual([]);
  });

  it('extracts EICAR test virus name when present in output', () => {
    // Given
    // A more realistic output that includes the virus name specifically mentioned
    const output = `-------------------------------------------------------------------------------
MpCmdRun: Command Line: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.25050.5-0\\MpCmdRun.exe" -Scan -ScanType 3 -DisableRemediation -File C:/Users/Esteban/Desktop/eicar.com.txt
Start Time: mar. jul. 15 2025 10:11:20
Scanning path as file: C:/Users/Esteban/Desktop/eicar.com.txt.
Threat detected: EICAR-Test-File (not a virus)
MpScan() started
MpScan() was completed
ERROR: MpScan(dwOptions=1107300385) Completion Failed 0x80508023
MpCmdRun.exe: hr = 0x80508023.
MpCmdRun: End Time: mar. jul. 15 2025 10:11:20
-------------------------------------------------------------------------------`;

    // When
    const result = extractVirusNamesFromOutput(output);

    // Then
    expect(result).toEqual(['EICAR-Test-File (not a virus)']);
  });
});
