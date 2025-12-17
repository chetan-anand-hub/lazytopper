// src/utils/topicResolver.ts
//
// Utility functions for normalising topic identifiers and creating
// human‑readable display names.  These helpers are used across
// TopicHub v2 and related modules to map between the various
// representations of a topic (slug, display name, etc.).

/**
 * Resolve a canonical topic key (slug) from a given parameter.  The
 * parameter may already be a slug (e.g. 'real-numbers') or it may be
 * a human‑readable name (e.g. 'Real Numbers').  This function
 * normalises the parameter by trimming whitespace, lowercasing the
 * string and replacing spaces and underscores with hyphens.  An
 * explicit topicKey may be provided to override this behaviour.
 */
export function resolveTopicKey({
  // `subjectKey` is accepted for compatibility but unused in the current v2
  // implementation.  Prefix with underscore to signal intentional
  // unused variable and suppress TS6133 warnings.
  subjectKey: _subjectKey,
  topicParam,
  explicitTopicKey,
}: {
  subjectKey: string;
  topicParam: string;
  explicitTopicKey?: string;
}): string {
  // Always prefer the explicit key if provided
  if (explicitTopicKey) return explicitTopicKey;
  // Normalise the incoming parameter to a slug
  const cleaned = (topicParam || '').trim().toLowerCase();
  // IMPORTANT:
  // Some topics contain punctuation like '&'. If we collapse hyphens BEFORE
  // removing non-alphanumerics, strings like "x-&-y" become "x--y" after
  // stripping '&', which then fails to match canonical keys.
  //
  // So we:
  // 1) turn spaces/underscores into hyphens
  // 2) strip invalid chars
  // 3) collapse repeated hyphens again
  return cleaned
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Convert a canonical topic key (slug) into a display name.  This
 * helper inserts spaces between words and capitalises the first
 * letter of each word.  For example, 'pair-of-linear-equations'
 * becomes 'Pair Of Linear Equations'.
 */
export function resolveTopicDisplayName(
  // `subjectKey` is not used in the display name computation, but we
  // accept it for future flexibility and suppress unused warnings.
  _subjectKey: string,
  topicKey: string
): string {
  const withSpaces = (topicKey || '').replace(/-+/g, ' ');
  return withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
}