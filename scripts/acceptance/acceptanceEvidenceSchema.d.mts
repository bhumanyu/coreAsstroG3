/**
 * Type declarations for acceptanceEvidenceSchema.mjs
 * These declarations allow TypeScript to understand the .mjs exports
 * when allowJs is disabled in tsconfig.json.
 */

export function hasAssignedOwner(value: string): boolean;

export function deriveAcceptanceProductStatus(
  record: Omit<{
    readonly storyId: string;
    readonly title: string;
    readonly productOwner: string;
    readonly qaOwner: string;
    readonly acceptanceCriteria: readonly string[];
    readonly implementationReferences: readonly string[];
    readonly requiredTestCommands: readonly string[];
    readonly expectedTestIds: readonly string[];
    readonly productStatusReason?: string;
    readonly execution: {
      readonly status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
      readonly testedSha: string | null;
      readonly ciRunId: string | null;
      readonly ciRunUrl: string | null;
      readonly commands: readonly {
        readonly command: string;
        readonly exitCode: number | null;
        readonly status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
      }[];
      readonly evidenceReferences: readonly string[];
      readonly skippedCount: number;
      readonly failureSummary?: string;
    };
  }, 'productStatus'>,
  reportSha: string
): 'COMPLETE' | 'PARTIAL' | 'BLOCKED' | 'UNAVAILABLE' | 'INSUFFICIENT_DATA' | 'NOT_ASSESSED' | 'BROKEN';

export function validateAcceptanceEvidenceReport(
  value: unknown,
  expectedSha?: string
): readonly string[];
