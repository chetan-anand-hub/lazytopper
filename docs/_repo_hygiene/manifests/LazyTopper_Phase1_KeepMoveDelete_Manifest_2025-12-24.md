# LazyTopper Phase 1 Keep/Move/Delete Manifest (repo snapshot 2025-12-24)

Generated: 2025-12-24 07:52:44.116274

## Buckets

- **A-keep**: keep in place (runtime + required docs/tools)

- **B-planned**: keep but **move out of `/src`** to `docs/_roadmap` (planned/experimental; preserve for future)

- **C-quarantine**: keep but **move out of `/src`** to `docs/_drafts` / `docs/_legacy` / `docs/_repo_hygiene` (drafts/legacy/non-runtime)

- **D-delete**: remove Windows/artifact junk. **Recommended: quarantine-first** (do not hard-delete).


## A-KEEP (do not move) (116 files)

- `.gitignore` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `README.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/BankHealthIntegrationNotes.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/DEPLOY_NOTES_Bundle1_2.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/README.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/README_PATCH.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/accessibility_inclusivity_audit.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/data-layer-contract.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/difficultyPolicy_v1.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/difficulty_refactor.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/gamification_engagement_ideas.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/implementation_notes.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/multi_language_expansion_plan.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `docs/protips_plan.md` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `eslint.config.js` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `index.html` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `package-lock.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `package.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `public/vite.svg` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `server/index.cjs` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/App.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/ai/aiClient.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/assets/react.svg` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/BackLink.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/DailyMixPlayer.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/MathText.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/MentorPanel.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/WeeklyWrappedCarousel.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/planner/StudyPlannerView.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/topicHub/ConceptCard.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/components/topicHub/ConceptDetail.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/context/ProfileContext.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/context/vibeModeContext.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/_sources/science/predictedQuestionsScience.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/_sources/science/predictedScienceQuestions.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/canonicalQuestionBank.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/cbseCompetencyPolicy.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/class10MathTopicTrends.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/class10MathTopicWeights.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/class10SciencePredictiveEngine.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/class10ScienceTopicTrends.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/highlyProbableQuestions.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/hpqAdditionsAndDailyMixSeeds.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/index.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/practiceSetGenerator.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictedQuestions.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictedQuestionsAdditions.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictionCore.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictionDataService.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictionTypes.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/predictivePapers.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/promptDPracticePacks.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/scienceQuestionAdditions.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/scienceQuestionBank.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/topicHubContent.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/topicHubCtaPracticePayloads.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/topicHubV2Enrichment.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/data/topicHubV2Full.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/domain/topicIdentity.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/engine/smartLearningStore.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/engine/smartLearningTypes.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/engine/studyPlanner.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/main.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/mentors/centralPersona.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/navigation/practiceNavigation.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/AiMentorPage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/DailyMixPage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/Dashboard.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/HighlyProbableQuestions.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/Home.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/Login.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/MockBuilder.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/MockPaper.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/Onboarding.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/PracticePage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/PredictivePapers.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/StudyPlanPage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/TopicHub.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/TrendsPage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/WeeklyWrappedPage.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/pages/aiMentorStyles.css` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/prediction/difficultyAutoSuggest.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/print.css` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/commandPaletteConfig.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/dailyMixPlayback.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/planStorage.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/practiceInsights.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/strategyEngine.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/strategyStorage.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/services/weeklyWrappedGenerator.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/styles.css` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/types/MentorRequest.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/types/navigation.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/ui/components/CommandPalette.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/ui/components/VibeToggle.tsx` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/ui/microcopy/vibeCommandBadgeCopy.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/buildStudyPlan.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/buildUrl.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/getTopicV2Content.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/mergeBucketsByTopic.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/mockPaperEngine.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/strategy.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/topicResolver.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `src/utils/useCurrentURL.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/LazyTopper_Repo_Snapshot.ps1` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/README_GUARDRAILS.txt` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/Step3_Apply_Quarantine.ps1` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/check-canonical-imports.mjs` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/cleanup-windows-artifacts.ps1` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/repo-introspect.ps1` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/step3_quarantine_manifest.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tools/verify-import-paths.mjs` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tsconfig.app.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tsconfig.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `tsconfig.node.json` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.

- `vite.config.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Part of runtime or repo tooling/docs.


## B-PLANNED (move to docs/_roadmap, keep for future) (26 files)

- `src/roadmap/README.md` → **MOVE** to `docs/_roadmap/src_roadmap/README.md`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ai/mentorPrompts.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ai/mentorPrompts.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ai/mentorPrompts_hi.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ai/mentorPrompts_hi.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/dailyMix/DailyMixWidget.tsx` → **MOVE** to `docs/_roadmap/src_roadmap/dailyMix/DailyMixWidget.tsx`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/mentors/mentorModeDirectives.ts` → **MOVE** to `docs/_roadmap/src_roadmap/mentors/mentorModeDirectives.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/practice/practiceEngine.ts` → **MOVE** to `docs/_roadmap/src_roadmap/practice/practiceEngine.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/prediction/bankHealth.ts` → **MOVE** to `docs/_roadmap/src_roadmap/prediction/bankHealth.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/prediction/buildTopicKeySources.ts` → **MOVE** to `docs/_roadmap/src_roadmap/prediction/buildTopicKeySources.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/prediction/difficultyAwarePractice.ts` → **MOVE** to `docs/_roadmap/src_roadmap/prediction/difficultyAwarePractice.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/predictiveSciencePapers.ts` → **MOVE** to `docs/_roadmap/src_roadmap/predictiveSciencePapers.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/dailyMixGenerator.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/dailyMixGenerator.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/dailyMixService.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/dailyMixService.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/matchScoreService.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/matchScoreService.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/sessionLogger.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/sessionLogger.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/streakService.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/streakService.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/services/weeklyWrapService.ts` → **MOVE** to `docs/_roadmap/src_roadmap/services/weeklyWrapService.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/topicHub/ux/OutlineDrawer.tsx` → **MOVE** to `docs/_roadmap/src_roadmap/topicHub/ux/OutlineDrawer.tsx`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/topicHub/ux/TopicHubTabs.tsx` → **MOVE** to `docs/_roadmap/src_roadmap/topicHub/ux/TopicHubTabs.tsx`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/types/mentor.ts` → **MOVE** to `docs/_roadmap/src_roadmap/types/mentor.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/types/topicHubV2ConceptTypes.ts` → **MOVE** to `docs/_roadmap/src_roadmap/types/topicHubV2ConceptTypes.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ui/microcopy/userFeedbackAlertsCopy.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ui/microcopy/userFeedbackAlertsCopy.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ui/microcopy/userFeedbackAlertsCopyVariants.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ui/microcopy/userFeedbackAlertsCopyVariants.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ui/microcopy/weeklyWrappedStoryCopy.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ui/microcopy/weeklyWrappedStoryCopy.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/ui/microcopy/weeklyWrappedStoryCopy_hi.ts` → **MOVE** to `docs/_roadmap/src_roadmap/ui/microcopy/weeklyWrappedStoryCopy_hi.ts`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/roadmap/weeklyWrapped/WeeklyWrappedWidget.tsx` → **MOVE** to `docs/_roadmap/src_roadmap/weeklyWrapped/WeeklyWrappedWidget.tsx`  
  _Risk:_ low  
  _Why:_ Planned/experimental modules; keep for future but remove from runtime src.

- `src/data/class10ContentConfig.ts` → **KEEP**  
  _Risk:_ low  
  _Why:_ Aligned with TopicHub expansion; currently unused but keep for v1+.


## C-QUARANTINE (move out of /src to docs/_drafts / docs/_legacy / docs/_repo_hygiene) (38 files)

- `src/contentDrafts/README.md` → **MOVE** to `docs/_drafts/src_contentDrafts/README.md`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/blueprintConfig.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/blueprintConfig.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/caseBasedQuestions.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/caseBasedQuestions.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10ExampleQuestions.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10ExampleQuestions.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10HighImpactMathTopics.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10HighImpactMathTopics.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10MathBreakdown.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10MathBreakdown.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10MathChapterMeta.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10MathChapterMeta.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10MathMicroMocks.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10MathMicroMocks.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10MathQuestionBank.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10MathQuestionBank.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/class10TopicRegistry.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/class10TopicRegistry.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/questionGenerator.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/questionGenerator.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/trig/trigFlashcards.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/trig/trigFlashcards.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/trig/trigQuestions.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/trig/trigQuestions.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/maths/weightage.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/maths/weightage.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/practice/practiceFilters.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/practice/practiceFilters.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/practice/practicePackSummaries.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/practice/practicePackSummaries.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/prediction/prediction.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/prediction/prediction.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/prediction/predictionBlueprintMapping.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/prediction/predictionBlueprintMapping.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/prediction/predictionScoring.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/prediction/predictionScoring.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/science/class10SciencePredictedQuestions.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/science/class10SciencePredictedQuestions.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/science/scienceQuestionGenerator.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/science/scienceQuestionGenerator.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/topicHub/topicHubCtaPracticePayloads.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/topicHub/topicHubCtaPracticePayloads.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/topicHub/topicHubV2ChapterSkeletonsPatch.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/topicHub/topicHubV2ChapterSkeletonsPatch.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/contentDrafts/topicHub/topicHubV2Microcopy.ts` → **MOVE** to `docs/_drafts/src_contentDrafts/topicHub/topicHubV2Microcopy.ts`  
  _Risk:_ low  
  _Why:_ Draft content not used by runtime; move out of src to keep launch repo clean.

- `src/legacy/README.md` → **MOVE** to `docs/_legacy/src_legacy/README.md`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/engine/paperEngine.ts` → **MOVE** to `docs/_legacy/src_legacy/engine/paperEngine.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/engine/predictionDataService_with_CBSEPracticeGen.ts` → **MOVE** to `docs/_legacy/src_legacy/engine/predictionDataService_with_CBSEPracticeGen.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/llm/llmClient.ts` → **MOVE** to `docs/_legacy/src_legacy/llm/llmClient.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/llm/llmConfig.ts` → **MOVE** to `docs/_legacy/src_legacy/llm/llmConfig.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/llm/llmQuestionGenerator.ts` → **MOVE** to `docs/_legacy/src_legacy/llm/llmQuestionGenerator.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/llm/llmQuestionTypes.ts` → **MOVE** to `docs/_legacy/src_legacy/llm/llmQuestionTypes.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/ui/theme.ts` → **MOVE** to `docs/_legacy/src_legacy/ui/theme.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/utils/mockBlueprint.ts` → **MOVE** to `docs/_legacy/src_legacy/utils/mockBlueprint.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/utils/mockBuilder.ts` → **MOVE** to `docs/_legacy/src_legacy/utils/mockBuilder.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/utils/mockPaperEngineScience.ts` → **MOVE** to `docs/_legacy/src_legacy/utils/mockPaperEngineScience.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/utils/planEngine.ts` → **MOVE** to `docs/_legacy/src_legacy/utils/planEngine.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/legacy/utils/topicMix.ts` → **MOVE** to `docs/_legacy/src_legacy/utils/topicMix.ts`  
  _Risk:_ low  
  _Why:_ Legacy code; not referenced by current runtime, archive outside src.

- `src/.gitignore` → **MOVE** to `docs/_repo_hygiene/src_gitignore_archived/.gitignore`  
  _Risk:_ low  
  _Why:_ Redundant; root .gitignore already covers patterns. Archive for reference.


## D-DELETE (quarantine-first; mostly Windows artifacts) (54 files)

- `desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `docs/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `public/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `server/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/ai/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/assets/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/components/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/components/planner/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/components/topicHub/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/maths/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/maths/trig/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/practice/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/prediction/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/science/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/contentDrafts/topicHub/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/context/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/data/_sources/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/data/_sources/science/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/data/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/dev/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/domain/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/engine/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/legacy/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/legacy/engine/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/legacy/llm/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/legacy/ui/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/legacy/utils/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/llm/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/mentors/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/navigation/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/pages/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/prediction/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/ai/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/dailyMix/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/mentors/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/practice/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/prediction/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/services/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/topicHub/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/topicHub/ux/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/types/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/ui/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/ui/microcopy/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/roadmap/weeklyWrapped/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/services/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/types/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/ui/components/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/ui/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/ui/microcopy/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `src/utils/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).

- `tools/desktop.ini` → **DELETE**  
  _Risk:_ low  
  _Why:_ Windows artifact (junk).
