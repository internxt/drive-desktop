import { extractVirusNamesFromOutput } from './extract-virus-names';

interface Props {
  stdout: string;
  stderr: string;
}

export function parseVirusNames({ stdout, stderr }: Props) {
  const output = `${stdout}${stderr}`;

  /**
   * v2.5.6 Esteban Galvis
   * MpcmdRun.exe can return multiple codes indicating different states of infection.
   * 0x80508023 indicates a threat was detected and remediated,
   * 0x80508007 indicates a threat was found but not remediated
   * If either of these codes is present, we consider the system infected.
   */
  const infectionHrCodes = ['0x80508023', '0x80508007'];

  const isInfected = infectionHrCodes.some((code) => output.includes(code));

  if (!isInfected) {
    return [];
  }

  const extractedVirusNames = extractVirusNamesFromOutput({ output });

  /**
   * v2.5.6 Esteban Galvis
   * MpcmdRun.exe in some cases may not return any virus names,
   * in which case we return a default value indicating a threat was detected.
   * based on the codes (0x80508023, 0x80508007) validation above.
   */
  if (extractedVirusNames.length === 0) {
    return ['Windows.Defender.Threat.Detected'];
  }

  return extractedVirusNames;
}
