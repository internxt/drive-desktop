import { z } from 'zod';

export const CheckpointsSchema = z.object({
  key: z.string(),
  checkpoint: z.string().datetime(),
});
export type TCheckpoints = z.infer<typeof CheckpointsSchema>;
