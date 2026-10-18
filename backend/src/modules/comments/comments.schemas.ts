import { z } from 'zod';

export const postIdParamSchema = z.object({ postId: z.uuid() });

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
