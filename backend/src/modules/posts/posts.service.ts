import { AppError } from '../../errors/app-error.js';
import { paginationArgs, paginationMeta, type Pagination } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { CreatePostInput, UpdatePostInput } from './posts.schemas.js';

const postListSelect = {
  id: true,
  title: true,
  published: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true } },
} as const;

const postDetailSelect = { ...postListSelect, content: true } as const;

async function listPosts(
  where: { published?: boolean; authorId?: string },
  pagination: Pagination,
) {
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: postListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationArgs(pagination),
    }),
    prisma.post.count({ where }),
  ]);
  return { data: posts, meta: paginationMeta(pagination, total) };
}

export function listPublishedPosts(pagination: Pagination) {
  return listPosts({ published: true }, pagination);
}

export function listPostsByAuthor(authorId: string, pagination: Pagination) {
  return listPosts({ authorId }, pagination);
}

export async function getPostForViewer(id: string, viewerId: string | undefined) {
  const post = await prisma.post.findUnique({ where: { id }, select: postDetailSelect });

  if (!post || (!post.published && post.author.id !== viewerId)) {
    throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
  }
  return post;
}

export function createPost(authorId: string, input: CreatePostInput) {
  return prisma.post.create({ data: { ...input, authorId }, select: postDetailSelect });
}

async function assertOwner(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });

  if (!post) {
    throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
  }
  if (post.authorId !== userId) {
    throw new AppError(403, 'You do not own this post', 'FORBIDDEN');
  }
}

export async function updatePost(userId: string, id: string, input: UpdatePostInput) {
  await assertOwner(id, userId);
  return prisma.post.update({ where: { id }, data: input, select: postDetailSelect });
}

export async function deletePost(userId: string, id: string) {
  await assertOwner(id, userId);
  await prisma.post.delete({ where: { id } });
}
