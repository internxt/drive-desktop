import { extractVirusNamesFromOutput } from './extract-virus-names';

interface Props {
  stdout: string;
  stderr: string;
}

/**
 * Parses the output from MpCmdRun.exe to extract actual virus names
 * @param stdout Standard output from MpCmdRun.exe
 * @param stderr Standard error from MpCmdRun.exe
 * @returns Array of virus names found
 */
export function parseVirusNames({ stdout, stderr }: Props) {
  const output = `${stdout}${stderr}`;

  const infectionHrCodes = [
    '0x80508023', // Threat detected and remediated
    '0x80508007', // Threat found but not remediated
  ];

  const isInfected = infectionHrCodes.some((code) => output.includes(code));

  if (!isInfected) {
    return [];
  }

  const extractedVirusNames = extractVirusNamesFromOutput(output);

  // If no specific virus names were found, add a generic name
  if (extractedVirusNames.length === 0) {
    return ['Windows.Defender.Threat.Detected'];
  }

  return extractedVirusNames;
}
