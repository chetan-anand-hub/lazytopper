import { resolveCanonicalTopicKey } from "../data/syllabus/topicAliasMap";
import {
  trigonometryLearningObjects,
  trigonometryQuestionTagIndex,
  trigonometryQuestionTypeTiles,
} from "../data/contentStrategy/trigonometry";
import type {
  LearningObject,
  QuestionMeta,
  QuestionTypeTile,
} from "../data/contentStrategy/types";

export type StrategyPack = {
  learningObjects: LearningObject[];
  tiles: QuestionTypeTile[];
  tagIndex: Record<string, QuestionMeta>;
};

const MIN_QTYPE_SET_SIZE = 8;

export function resolveCanonicalTopicForStrategy(rawTopicKey: string): string {
  return resolveCanonicalTopicKey(rawTopicKey);
}

export function isStrategyEnabledForTopic(canonicalTopicKey: string): boolean {
  return resolveCanonicalTopicKey(canonicalTopicKey) === "trigonometry";
}

export function getStrategyPackForTopic(rawTopicKey: string): StrategyPack | null {
  const canonicalTopicKey = resolveCanonicalTopicForStrategy(rawTopicKey);
  if (!isStrategyEnabledForTopic(canonicalTopicKey)) return null;
  return {
    learningObjects: trigonometryLearningObjects,
    tiles: trigonometryQuestionTypeTiles,
    tagIndex: trigonometryQuestionTagIndex,
  };
}

export function getQuestionMeta(
  questionId: string,
  rawTopicKey?: string
): QuestionMeta | null {
  if (rawTopicKey) {
    const canonicalTopicKey = resolveCanonicalTopicForStrategy(rawTopicKey);
    if (!isStrategyEnabledForTopic(canonicalTopicKey)) return null;
  }
  return trigonometryQuestionTagIndex[String(questionId)] || null;
}

export function getQuestionIdsForLo(loId: string): string[] {
  const targetLoId = String(loId || "").trim();
  if (!targetLoId) return [];
  return Object.values(trigonometryQuestionTagIndex)
    .filter((meta) => Array.isArray(meta.loIds) && meta.loIds.includes(targetLoId))
    .map((meta) => meta.questionId);
}

export function getQuestionIdsForQType(qtypeId: string): string[] {
  const targetQTypeId = String(qtypeId || "").trim();
  if (!targetQTypeId) return [];
  const tile = trigonometryQuestionTypeTiles.find((t) => t.qtypeId === targetQTypeId);
  if (!tile) return [];

  const allEntries = Object.values(trigonometryQuestionTagIndex);
  const loSet = new Set(tile.loIds);
  const primary = allEntries
    .filter((meta) => meta.loIds.some((loId) => loSet.has(loId)))
    .map((meta) => meta.questionId);

  if (primary.length >= MIN_QTYPE_SET_SIZE) return primary;

  const byFormat = allEntries
    .filter((meta) => meta.cbseFormat === tile.cbseFormat)
    .map((meta) => meta.questionId);

  const tileSkill = String(tile.skillFamily || "").trim().toLowerCase();
  const bySkillFamily = allEntries
    .filter((meta) => String(meta.skillFamily || "").trim().toLowerCase() === tileSkill)
    .map((meta) => meta.questionId);

  const ordered = [...primary, ...byFormat, ...bySkillFamily, ...allEntries.map((meta) => meta.questionId)];
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const id of ordered) {
    const key = String(id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(key);
  }

  if (deduped.length <= MIN_QTYPE_SET_SIZE) return deduped;
  return deduped.slice(0, MIN_QTYPE_SET_SIZE);
}

function dedupePreservingOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const key = String(id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function hasLoIntersection(meta: QuestionMeta, tileLoSet: Set<string>): boolean {
  if (!Array.isArray(meta.loIds) || meta.loIds.length === 0) return false;
  return meta.loIds.some((loId) => tileLoSet.has(String(loId || "").trim()));
}

export function getFocusIdsForTile(rawTopicKey: string, tile: QuestionTypeTile): string[] {
  const pack = getStrategyPackForTopic(rawTopicKey);
  if (!pack) return [];

  const tileFormat = String(tile.cbseFormat || "").trim();
  const tileSkill = String(tile.skillFamily || "").trim();
  const tileLoSet = new Set((tile.loIds || []).map((loId) => String(loId || "").trim()).filter(Boolean));
  const allEntries = Object.values(pack.tagIndex || {});

  const tier1 = allEntries
    .filter((meta) => String(meta.cbseFormat || "").trim() === tileFormat)
    .filter((meta) => String(meta.skillFamily || "").trim() === tileSkill)
    .map((meta) => meta.questionId);

  const tier2 = allEntries
    .filter((meta) => String(meta.cbseFormat || "").trim() === tileFormat)
    .filter((meta) => hasLoIntersection(meta, tileLoSet))
    .map((meta) => meta.questionId);

  const tier3 = allEntries
    .filter((meta) => String(meta.skillFamily || "").trim() === tileSkill)
    .filter((meta) => hasLoIntersection(meta, tileLoSet))
    .map((meta) => meta.questionId);

  const tier4 = allEntries
    .filter((meta) => hasLoIntersection(meta, tileLoSet))
    .map((meta) => meta.questionId);

  let ordered = dedupePreservingOrder([...tier1, ...tier2, ...tier3, ...tier4]);
  if (ordered.length < MIN_QTYPE_SET_SIZE) {
    const fallback = getQuestionIdsForQType(tile.qtypeId);
    ordered = dedupePreservingOrder([...ordered, ...fallback]);
  }

  return ordered;
}
