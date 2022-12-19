type Ok = { state: 'OK' };
type Bad = { state: 'ERROR' | 'TO_MANY_REPORTS' };

export type BugReportResult = Ok | Bad;
