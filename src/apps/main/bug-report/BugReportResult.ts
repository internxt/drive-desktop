type Ok = { state: 'OK' };
type Bad = { state: 'ERROR' | 'TOO_MANY_REPORTS' };

export type BugReportResult = Ok | Bad;
