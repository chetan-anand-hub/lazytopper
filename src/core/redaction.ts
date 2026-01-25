import * as fs from 'fs';
import * as path from 'path';

export interface RedactionFinding {
  ruleId: string;
  count: number;
}

export interface RedactionResult {
  redactedText: string;
  changed: boolean;
  findings: RedactionFinding[];
}

interface RedactionRule {
  id: string;
  pattern: RegExp;
  replace(match: string): string;
}

interface CustomRuleDef {
  id: string;
  pattern: string;
  flags?: string;
  replacement?: string;
}

const MAX_CUSTOM_RULES = 100;
const REDACTION_MODE = process.env.PMEM_REDACTION_MODE === 'off' ? 'off' : 'on';
const CONFIG_FILENAME = path.join('.project_memory', 'redaction_rules.json');
const CONFIG_CACHE = new Map<string, { mtimeMs: number; enabled: boolean; rules: RedactionRule[] }>();

function maskMiddle(value: string, keepPrefix: number, keepSuffix: number): string {
  if (value.length <= keepPrefix + keepSuffix) return value;
  const prefix = value.slice(0, keepPrefix);
  const suffix = value.slice(value.length - keepSuffix);
  const maskedLength = Math.max(4, value.length - keepPrefix - keepSuffix);
  const mask = '*'.repeat(maskedLength);
  return `${prefix}${mask}${suffix}`;
}

function createDefaultRule(id: string, pattern: RegExp, keepPrefix: number, keepSuffix: number): RedactionRule {
  return {
    id,
    pattern,
    replace(match: string): string {
      return maskMiddle(match, keepPrefix, keepSuffix);
    }
  };
}

const DEFAULT_RULES: RedactionRule[] = [
  createDefaultRule('openai-sk', /sk-[A-Za-z0-9]{20,}/g, 3, 4),
  createDefaultRule('github-token', /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g, 4, 4),
  createDefaultRule('jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, 3, 4),
  createDefaultRule('aws-access-key', /\bAKIA[0-9A-Z]{16}\b/g, 4, 4)
];

function ensureGlobalFlags(rawPattern: string, rawFlags?: string): RegExp {
  const normalizedFlags = rawFlags ? Array.from(new Set(rawFlags.split(''))).join('') : '';
  const flagsWithGlobal = normalizedFlags.includes('g')
    ? normalizedFlags
    : `${normalizedFlags}g`;
  return new RegExp(rawPattern, flagsWithGlobal);
}

async function loadCustomRules(repoRoot: string): Promise<RedactionRule[]> {
  const configPath = path.join(repoRoot, CONFIG_FILENAME);
  try {
    const stat = await fs.promises.stat(configPath);
    const cached = CONFIG_CACHE.get(configPath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.enabled ? [...DEFAULT_RULES, ...cached.rules] : DEFAULT_RULES;
    }
    const raw = await fs.promises.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as { enabled?: boolean; rules?: CustomRuleDef[] };
    const enabled = Boolean(parsed.enabled);
    const rules: RedactionRule[] = [];
    if (enabled && Array.isArray(parsed.rules)) {
      let added = 0;
      for (const ruleDef of parsed.rules) {
        if (!ruleDef?.id || !ruleDef.pattern) continue;
        if (added >= MAX_CUSTOM_RULES) break;
        try {
          const regex = ensureGlobalFlags(ruleDef.pattern, ruleDef.flags);
          const replacement = typeof ruleDef.replacement === 'string'
            ? ruleDef.replacement
            : '[REDACTED]';
          rules.push({
            id: ruleDef.id,
            pattern: regex,
            replace: () => replacement
          });
          added += 1;
        } catch {
          continue;
        }
      }
    }
    CONFIG_CACHE.set(configPath, { mtimeMs: stat.mtimeMs, enabled, rules });
    return enabled ? [...DEFAULT_RULES, ...rules] : DEFAULT_RULES;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      // Keep silent to avoid leaking secrets or config issues.
    }
    return DEFAULT_RULES;
  }
}

export async function redactSensitive(repoRoot: string | undefined, _targetPath: string, text: string): Promise<RedactionResult> {
  if (REDACTION_MODE === 'off') {
    return { redactedText: text, changed: false, findings: [] };
  }
  const rules = repoRoot ? await loadCustomRules(repoRoot) : DEFAULT_RULES;
  let workingText = text;
  const findingsMap = new Map<string, number>();
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let count = 0;
    workingText = workingText.replace(rule.pattern, match => {
      count += 1;
      return rule.replace(match);
    });
    if (count > 0) {
      findingsMap.set(rule.id, (findingsMap.get(rule.id) ?? 0) + count);
    }
  }
  const findings = Array.from(findingsMap.entries()).map(([ruleId, count]) => ({ ruleId, count }));
  return {
    redactedText: workingText,
    changed: findings.length > 0,
    findings
  };
}
