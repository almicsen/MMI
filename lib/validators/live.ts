import { z } from 'zod';

export const liveShowSchema = z.object({
  title: z.string().min(1).max(120),
  prize: z.number().nonnegative(),
  startTime: z.union([z.date(), z.string(), z.object({ seconds: z.number() })]),
  status: z.enum(['scheduled', 'live', 'ended']),
});

export const liveStatsSchema = z.object({
  balance: z.number().nonnegative(),
  hearts: z.number().nonnegative(),
  weeklyRank: z.number().nonnegative(),
});
