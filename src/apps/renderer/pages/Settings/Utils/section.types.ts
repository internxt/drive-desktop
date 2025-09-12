export const sectionValues = [
  'GENERAL',
  'ACCOUNT',
  'BACKUPS',
  'ANTIVIRUS',
  'CLEANER',
] as const;
export type Section = (typeof sectionValues)[number];

export function isTypeSection(section: string): section is Section {
  return (sectionValues as readonly string[]).includes(section);
}
