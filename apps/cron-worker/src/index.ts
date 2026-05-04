/**
 * Cron 진입점.
 * Vercel Cron이 apps/web/api/cron/[job]을 호출하면 거기서 이 핸들러를 위임 호출.
 */
import { runAutoConfirmJob } from './jobs/auto-confirm';
import { runExpireBuyerBidsJob } from './jobs/expire-buyer-bids';
import { runSamedayDeadlineJob } from './jobs/sameday-deadline';
import { runSettlementJob } from './jobs/settlement';

export const jobs = {
  'auto-confirm': runAutoConfirmJob,
  settlement: runSettlementJob,
  'sameday-deadline': runSamedayDeadlineJob,
  'expire-buyer-bids': runExpireBuyerBidsJob,
} as const;

export type JobId = keyof typeof jobs;
