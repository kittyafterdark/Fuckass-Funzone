/** Single, testable source of truth for arcade ticket milestones. */
export const MILESTONE_STEP = Object.freeze({ bird:5, gabi:5, snake:2, '2048':64, match3:400, simon:2, duck:3, tetris:1000, solitaire:100, froggy:100, chess:100, berry:100, tictac:100, cake:100, bubble:300, boop:100, wafer:100, memory:100 });
export const MAX_TICKETS = 100000000;
export function milestonePayout(game, oldBest, currentScore) {
  const step = MILESTONE_STEP[game];
  if (!step) return 0;
  const prior = Math.max(0, Math.floor(Number(oldBest)||0));
  const score = Math.max(0, Math.floor(Number(currentScore)||0));
  if (score <= prior) return 0;
  return Math.max(0, Math.min(99, Math.floor(score/step)-Math.floor(prior/step)));
}
export function creditTickets(wallet, payout) {
  const previous = Number.isSafeInteger(wallet) ? Math.max(0, Math.min(MAX_TICKETS, wallet)) : 0;
  const amount = Number.isFinite(payout) ? Math.max(0, Math.floor(payout)) : 0;
  return Math.min(MAX_TICKETS, previous + Math.min(MAX_TICKETS, amount));
}
