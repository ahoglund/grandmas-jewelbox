import { GEM_VALUES, CHAIN_MULTIPLIERS, MILESTONE_STEP } from "./constants.js";

// Score awarded for one clear step (a single match-and-clear pass, whether
// it's the initial match or a later cascade step). chainCount is 1-based
// (1 = the first match in this drop's cascade, 2 = the next cascade step,
// etc.) and indexes into CHAIN_MULTIPLIERS, clamped at the table's end so
// arbitrarily long cascades still get an (increasingly generous) multiplier.
export function calculateStepScore(clearedColors, chainCount) {
  const multiplierIndex = Math.min(chainCount - 1, CHAIN_MULTIPLIERS.length - 1);
  const multiplier = CHAIN_MULTIPLIERS[Math.max(0, multiplierIndex)];
  const base = clearedColors.reduce((sum, color) => sum + (GEM_VALUES[color] ?? 0), 0);
  return base * multiplier;
}

// Given the current total score and the next milestone threshold, returns
// how many extra lives were just earned and the new (possibly repeatedly
// advanced) next milestone. Uses a loop rather than a single check so one
// large cascade crossing multiple milestones at once is credited fully.
export function checkMilestones(score, nextMilestone) {
  let livesGained = 0;
  let milestone = nextMilestone;
  while (score >= milestone) {
    livesGained++;
    milestone += MILESTONE_STEP;
  }
  return { livesGained, nextMilestone: milestone };
}
