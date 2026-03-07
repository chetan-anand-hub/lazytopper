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
