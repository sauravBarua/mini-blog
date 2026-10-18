import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginationArgs({ page, limit }: Pagination) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginationMeta({ page, limit }: Pagination, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
