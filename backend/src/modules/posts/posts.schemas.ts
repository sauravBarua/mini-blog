import { z } from 'zod';

const title = z.string().trim().min(1).max(200);
const content = z.string().trim().min(1).max(50_000);

export const createPostSchema = z.object({
  title,
  content,
  published: z.boolean().default(false),
});

export const updatePostSchema = z
  .object({
    title: title.optional(),
    content: content.optional(),
    published: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field is required',
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
