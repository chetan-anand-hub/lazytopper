import { resolveCanonicalTopicKey } from "../data/syllabus/topicAliasMap";
import { resolveTopicDisplayName } from "../utils/topicResolver";

export interface TopicTeachContract {
  canonicalTopicKey: string;
  subject: "Maths" | "Science";
  goalLine: string;
  keyIdeas: [string, string, string, string];
  checkpointQuestion: string;
  checkpointAnswer: string;
  commonMistake: string;
}

type TeachContractSeed = Omit<TopicTeachContract, "canonicalTopicKey">;

const mathsGeneric: TeachContractSeed = {
  subject: "Maths",
  goalLine: "Learn {topic} in CBSE board-writing format.",
  keyIdeas: [
    "state the core definition used in this question.",
    "name the exact theorem/criterion/formula before applying it.",
    "maintain correspondence and write each logical step with reason.",
    "end with Therefore/Hence and the asked result.",
  ],
  checkpointQuestion:
    "Board checkpoint: For {topic}, write Given, To Prove/Find, theorem/formula used, and final Therefore/Hence line.",
  checkpointAnswer:
    "Expected answer: Given: [state data for {topic}]. To Prove/Find: [required result]. Criterion/Theorem/Formula: [exact name]. Therefore/Hence: [final result line].",
  commonMistake:
    "Common mistake: applying a theorem/formula without conditions or correspondence. This can lose marks in CBSE board checking.",
};

const scienceGeneric: TeachContractSeed = {
  subject: "Science",
  goalLine: "Learn {topic} in CBSE board-writing format with concept clarity and application.",
  keyIdeas: [
    "state the concept/definition in one precise line.",
    "name the governing law/principle/process before using it.",
    "link cause and effect with one evidence-based explanation.",
    "conclude with exam-safe wording and units/labels where required.",
  ],
  checkpointQuestion:
    "Board checkpoint: For {topic}, write Given context, concept/law used, one reasoning step, and a final Therefore/Hence conclusion.",
  checkpointAnswer:
    "Expected answer: Given: [context for {topic}]. To Prove/Find: [required explanation/result]. Principle/Law: [exact name]. Therefore/Hence: [final conclusion line].",
  commonMistake:
    "Common mistake: writing statements without naming the correct principle/law or missing labels/units. This can lose marks in CBSE board checking.",
};

const topicSpecificSeeds: Record<string, TeachContractSeed> = {
  triangles: {
    ...mathsGeneric,
    goalLine: "Learn {topic} with similarity logic in CBSE board-writing format.",
    keyIdeas: [
      "define similarity in terms of corresponding angles/sides.",
      "state AA/SAS/SSS or BPT criterion exactly before proof.",
      "maintain vertex correspondence order through all ratios.",
      "close with Therefore/Hence and required proportionality/result.",
    ],
    checkpointQuestion:
      "Board checkpoint: Which similarity criterion is valid in this {topic} question? Use Given, To Prove, criterion, and Therefore/Hence format.",
    checkpointAnswer:
      "Expected answer: Given: [matching angle/side data]. To Prove: [triangles are similar or required relation]. Criterion/Theorem: [AA/SAS/SSS/BPT exact name]. Therefore/Hence: [final similarity/proportionality line].",
    commonMistake:
      "Common mistake: skipping correspondence order or criterion name in similarity proofs. This can lose marks in CBSE board checking.",
  },
  trigonometry: {
    ...mathsGeneric,
    goalLine: "Learn {topic} with ratio selection and identity discipline in CBSE board-writing format.",
    keyIdeas: [
      "define ratio/identity with respect to the chosen angle.",
      "state the exact identity/formula before substitution.",
      "track opposite-adjacent-hypotenuse and sign carefully.",
      "conclude with simplified final value/result and units if needed.",
    ],
    checkpointQuestion:
      "Board checkpoint: For this {topic} item, write Given, To Find, formula used, and Therefore/Hence conclusion.",
    checkpointAnswer:
      "Expected answer: Given: [angle/side data]. To Find: [ratio/value]. Criterion/Theorem/Formula: [trigonometric identity or ratio]. Therefore/Hence: [final simplified value].",
    commonMistake:
      "Common mistake: selecting the wrong ratio or identity for the given angle setup. This can lose marks in CBSE board checking.",
  },
  "coordinate-geometry": {
    ...mathsGeneric,
    goalLine: "Learn {topic} with formula setup and coordinate substitution in CBSE board-writing format.",
    keyIdeas: [
      "state coordinate points and required relation clearly.",
      "name the distance/section formula before substitution.",
      "substitute coordinates carefully with sign discipline.",
      "conclude with final coordinate/distance statement.",
    ],
    checkpointQuestion:
      "Board checkpoint: In this {topic} question, write Given points, To Find, formula used, and Therefore/Hence final value.",
    checkpointAnswer:
      "Expected answer: Given: [coordinates]. To Find: [distance/section]. Criterion/Theorem/Formula: [distance/section formula]. Therefore/Hence: [final computed result].",
    commonMistake:
      "Common mistake: sign errors during coordinate substitution. This can lose marks in CBSE board checking.",
  },
  electricity: {
    ...scienceGeneric,
    goalLine: "Learn {topic} with circuit-law reasoning in CBSE board-writing format.",
    keyIdeas: [
      "define current/voltage/resistance/power in context.",
      "state Ohm's law or circuit rule before calculation.",
      "show substitution with units and valid series/parallel logic.",
      "conclude with interpreted result and unit.",
    ],
    checkpointQuestion:
      "Board checkpoint: For this {topic} circuit case, write Given values, law used, one calculation step, and final Therefore/Hence result.",
    checkpointAnswer:
      "Expected answer: Given: [circuit values]. To Prove/Find: [required electrical quantity]. Principle/Law: [Ohm's law/series-parallel rule]. Therefore/Hence: [final value with unit].",
    commonMistake:
      "Common mistake: mixing series and parallel resistance rules or omitting units. This can lose marks in CBSE board checking.",
  },
  "light-reflection-and-refraction-incl-human-eye-prism": {
    ...scienceGeneric,
    goalLine: "Learn {topic} with ray-rule reasoning in CBSE board-writing format.",
    keyIdeas: [
      "state mirror/lens/ray concept with proper sign convention.",
      "name the governing law/formula before solving.",
      "trace rays/labels correctly and justify image nature.",
      "conclude with final observation/result in exam-safe language.",
    ],
    checkpointQuestion:
      "Board checkpoint: For this {topic} prompt, write Given setup, law/formula used, one reasoned step, and final Therefore/Hence conclusion.",
    checkpointAnswer:
      "Expected answer: Given: [optical setup]. To Prove/Find: [image or value]. Principle/Law: [reflection/refraction/lens formula]. Therefore/Hence: [final image/result statement].",
    commonMistake:
      "Common mistake: wrong sign convention or unlabeled ray diagram reasoning. This can lose marks in CBSE board checking.",
  },
  "life-processes": {
    ...scienceGeneric,
    goalLine: "Learn {topic} with process-sequence clarity in CBSE board-writing format.",
    keyIdeas: [
      "define the biological process and key term first.",
      "name the governing concept/process relation explicitly.",
      "explain the sequence with cause-effect logic and labels.",
      "conclude with the asked function/result in crisp exam language.",
    ],
    checkpointQuestion:
      "Board checkpoint: For this {topic} question, write Given context, process principle, one reasoning step, and final Therefore/Hence line.",
    checkpointAnswer:
      "Expected answer: Given: [biological context]. To Prove/Find: [function/outcome]. Principle/Law: [named process concept]. Therefore/Hence: [final biologically correct conclusion].",
    commonMistake:
      "Common mistake: listing facts without process sequence or correct terminology. This can lose marks in CBSE board checking.",
  },
};

function applyTopic(seed: string, topic: string): string {
  return String(seed || "").replace(/\{topic\}/g, topic);
}

function buildContract(
  canonicalTopicKey: string,
  seed: TeachContractSeed,
  topicLabel: string
): TopicTeachContract {
  return {
    canonicalTopicKey,
    subject: seed.subject,
    goalLine: applyTopic(seed.goalLine, topicLabel),
    keyIdeas: [
      applyTopic(seed.keyIdeas[0], topicLabel),
      applyTopic(seed.keyIdeas[1], topicLabel),
      applyTopic(seed.keyIdeas[2], topicLabel),
      applyTopic(seed.keyIdeas[3], topicLabel),
    ],
    checkpointQuestion: applyTopic(seed.checkpointQuestion, topicLabel),
    checkpointAnswer: applyTopic(seed.checkpointAnswer, topicLabel),
    commonMistake: applyTopic(seed.commonMistake, topicLabel),
  };
}

export function resolveTopicTeachContract(input: {
  topicKey?: string;
  subject?: string;
  nodeTitle?: string;
}): TopicTeachContract | null {
  const topicRaw = String(input.topicKey || "").trim();
  const canonical = resolveCanonicalTopicKey(topicRaw);
  const subject = String(input.subject || "").toLowerCase().includes("science")
    ? "Science"
    : "Maths";
  const topicLabel =
    String(input.nodeTitle || "").trim() ||
    resolveTopicDisplayName(subject, canonical || topicRaw) ||
    "this concept";

  if (canonical && topicSpecificSeeds[canonical]) {
    return buildContract(canonical, topicSpecificSeeds[canonical], topicLabel);
  }
  const seed = subject === "Science" ? scienceGeneric : mathsGeneric;
  return buildContract(canonical || resolveCanonicalTopicKey(topicLabel), seed, topicLabel);
}
