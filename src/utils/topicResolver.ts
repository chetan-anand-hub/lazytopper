// src/utils/topicResolver.ts
//
// Single source of truth for topic key normalization across LazyTopper.
// Canonical topicKey format: **hyphen-slug** (e.g. "acids-bases-salts").
// Some datasets (Prompt-D practice packs) use underscore_keys; use
// `toPracticePackKey()` as a bridge when looking up those packs.

export type SubjectKey = "Maths" | "Science";

export interface ResolveTopicKeyArgs {
  subjectKey?: string; // often 'maths' | 'science' in older code paths
  topicParam: string;
  /** Optional explicit topicKey coming from navigation/query state */
  topicKey?: string | null;
}

/** Strip a UTF-8 BOM if present (common source of invisible mismatches). */
export function stripBom(input: string): string {
  return input?.startsWith("\ufeff") ? input.slice(1) : input;
}

/**
 * Canonical topic key normalization.
 * - lowercases
 * - converts spaces/underscores to hyphens
 * - replaces & with 'and'
 * - removes punctuation (keeps a-z, 0-9, hyphen)
 * - collapses repeated hyphens
 */
export function normalizeTopicKey(raw: string): string {
  const s = stripBom(String(raw ?? "")).trim().toLowerCase();
  if (!s) return "";

  const cleaned = s
    .replace(/&/g, " and ")
    .replace(/[\/\\]/g, " ")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned;
}

/**
 * Bridge to Prompt-D practice packs (underscore keys).
 * Example: "acids-bases-salts" -> "acids_bases_salts"
 */
export function toPracticePackKey(canonicalTopicKey: string): string {
  return normalizeTopicKey(canonicalTopicKey).replace(/-/g, "_");
}

/**
 * Legacy-friendly resolver: returns canonical hyphen-slug.
 * Accepts either a slug or a display string.
 */
export function resolveTopicKey(args: ResolveTopicKeyArgs): string {
  // Prefer explicit topicKey if provided
  const explicit = args.topicKey ? String(args.topicKey) : "";
  if (explicit) return normalizeTopicKey(explicit);

  return normalizeTopicKey(args.topicParam);
}

/**
 * Convert a canonical topic key (slug) into a display name.
 * Example: "pair-of-linear-equations" -> "Pair Of Linear Equations"
 */
export function resolveTopicDisplayName(_subjectKey: string, topicKey: string): string {
  const withSpaces = (topicKey || "").replace(/-+/g, " ");
  return withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
}

