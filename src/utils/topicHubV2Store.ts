// NOTE: FinalEnrichment retired (Jan 2026). Use topicHubV2Enrichment as the single enrichment/override layer.\r\n// src/utils/topicHubV2Store.ts
// Runtime accessor for baked TopicHubV2 content (main branch friendly).
// Keeps src/utils/getTopicV2Content.ts as type/interface-only to avoid circular-import issues.

import { topicHubV2Content } from "../data/topicHubV2Full";
import { topicHubV2Enrichment } from "../data/topicHubV2Enrichment";
import type { TopicHubV2Content } from "./getTopicV2Content";

import { normalizeTopicKey } from "./topicResolver";
export { normalizeTopicKey };

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

/**
 * Deep-merge that:
 * - merges plain objects recursively
 * - arrays: enrichment overrides base if provided (keeps things predictable)
 * - primitives: enrichment overrides base
 */
function deepMerge<T>(base: T, enrich: Partial<T>): T {
  const b: any = base as any;
  const e: any = enrich as any;

  if (Array.isArray(b) && Array.isArray(e)) return e as any;
  if (!isPlainObject(b) || !isPlainObject(e)) return (e ?? b) as any;

  const out: Record<string, unknown> = { ...b };
  for (const k of Object.keys(e)) {
    const bv = (b as any)[k];
    const ev = (e as any)[k];

    if (ev === undefined) continue;
    if (Array.isArray(bv) && Array.isArray(ev)) out[k] = ev;
    else if (isPlainObject(bv) && isPlainObject(ev)) out[k] = deepMerge(bv, ev);
    else out[k] = ev;
  }
  return out as T;
}

/**
 * Returns baked TopicHubV2 content (base + optional enrichment), or null if not found.
 */
export function getTopicV2Content(topicKey: string): TopicHubV2Content | null {
  const key = normalizeTopicKey(topicKey);

  const base =
    (topicHubV2Content as any)[key] ??
    (topicHubV2Content as any)[topicKey] ??
    null;

  if (!base) return null;

  const enrich =
  (topicHubV2Enrichment as any)[key] ??
  (topicHubV2Enrichment as any)[topicKey] ??
  {};

const overrides =
  (topicHubV2Enrichment as any)[key] ??
  (topicHubV2Enrichment as any)[topicKey] ??
  {};
return deepMerge(deepMerge(base as TopicHubV2Content, enrich as Partial<TopicHubV2Content>), overrides as Partial<TopicHubV2Content>);}


