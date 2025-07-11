import { describe, expect, it, vi } from 'vitest';
import { parseVirusNames } from '../parse-virus-names';

describe('parseVirusNames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array if isInfected is false', () => {
    // Given
    const stdout = 'Some output';
    const stderr = 'Some error';
    const isInfected = false;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual([]);
  });

  it('extracts virus names from pattern "Threat detected: VirusName"', () => {
    // Given
    const stdout = 'Scanning file... Threat detected: TestVirus1';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus1']);
  });

  it('extracts virus names from pattern "Threat VirusName was detected"', () => {
    // Given
    const stdout = 'Scanning file... Threat TestVirus2 was detected';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus2']);
  });

  it('extracts virus names from pattern "Found VirusName threat"', () => {
    // Given
    const stdout = 'Scanning file... Found TestVirus3 threat';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus3']);
  });

  it('extracts virus names from pattern "Malware VirusName detected"', () => {
    // Given
    const stdout = 'Scanning file... Malware TestVirus4 detected';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus4']);
  });

  it('extracts virus names from pattern "Virus VirusName found"', () => {
    // Given
    const stdout = 'Scanning file... Virus TestVirus5 found';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus5']);
  });

  it('extracts virus names from pattern "Infected with VirusName"', () => {
    // Given
    const stdout = 'Scanning file... Infected with TestVirus6';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus6']);
  });

  it('combines output from stdout and stderr', () => {
    // Given
    const stdout = 'Scanning file... Virus TestVirus7 found';
    const stderr = 'Error: Threat TestVirus8 was detected';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toContain('TestVirus7');
    expect(result).toContain('TestVirus8');
    expect(result.length).toBe(2);
  });

  it('removes duplicates', () => {
    // Given
    const stdout = 'Scanning file... Virus TestVirus9 found. Another instance: Virus TestVirus9 found';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus9']);
  });

  it('cleans up virus names by removing quotes and file: prefix', () => {
    // Given
    const stdout = 'Scanning file... Virus file:TestVirus10 found';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['TestVirus10']);
  });

  it('returns default threat name if no virus names are found', () => {
    // Given
    const stdout = 'Scanning file... Something detected but no pattern match';
    const stderr = '';
    const isInfected = true;

    // When
    const result = parseVirusNames(stdout, stderr, isInfected);

    // Then
    expect(result).toEqual(['Windows.Defender.Threat.Detected']);
  });
});
