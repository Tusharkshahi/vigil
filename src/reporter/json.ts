import { ChangeReport } from '../types';

export function toJsonReport(reports: ChangeReport[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        total: reports.length,
        withBreaking: reports.filter((r) => r.hasBreaking).length,
        withDeprecations: reports.filter((r) => r.deprecated.length > 0).length,
      },
      packages: reports,
    },
    null,
    2
  );
}
