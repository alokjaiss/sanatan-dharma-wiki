/**
 * npm run validate — integrity checks for every entry and the backlog (MASTER_PROMPT.md §8).
 * Exits with status 1 when there are errors; warnings never fail the run.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { readEntries } from '../src/lib/content-index';
import { validateBacklog, validateEntries, type Finding } from '../src/lib/validate';

const BACKLOG = 'backlog/content.yaml';

const { entries, problems } = readEntries();
const result = validateEntries(entries);
const errors: Finding[] = [...problems.map((problem) => ({ ...problem, level: 'error' as const })), ...result.errors];
const warnings: Finding[] = [...result.warnings];

if (existsSync(BACKLOG)) {
  try {
    const backlog = validateBacklog(parse(readFileSync(BACKLOG, 'utf8')), entries, BACKLOG);
    errors.push(...backlog.errors);
    warnings.push(...backlog.warnings);
  } catch (error) {
    errors.push({ level: 'error', file: BACKLOG, message: `Unreadable YAML: ${(error as Error).message}` });
  }
}

const byLocation = (a: Finding, b: Finding) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0);
const print = (symbol: string, finding: Finding) => {
  const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
  console.log(`${symbol} ${location}\n    ${finding.message}`);
};

for (const finding of warnings.sort(byLocation)) print('⚠', finding);
for (const finding of errors.sort(byLocation)) print('✖', finding);

const counts = `${entries.length} entries · ${errors.length} error(s) · ${warnings.length} warning(s)`;
if (errors.length > 0) {
  console.log(`\nValidation failed: ${counts}`);
  process.exitCode = 1;
} else {
  console.log(`\nValidation passed: ${counts}`);
}
