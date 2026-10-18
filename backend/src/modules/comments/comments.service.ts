import { AppError } from '../../errors/app-error.js';
import { paginationArgs, paginationMeta, type Pagination } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import type { CreateCommentInput } from './comments.schemas.js';

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

async function assertPublishedPost(postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { published: true } });

  if (!post?.published) {
    throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
  }
}

export async function listComments(postId: string, pagination: Pagination) {
  await assertPublishedPost(postId);

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { postId },
      select: commentSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      ...paginationArgs(pagination),
    }),
    prisma.comment.count({ where: { postId } }),
  ]);
  return { data: comments, meta: paginationMeta(pagination, total) };
}

export async function createComment(postId: string, authorId: string, input: CreateCommentInput) {
  await assertPublishedPost(postId);
  return prisma.comment.create({
    data: { postId, authorId, content: input.content },
    select: commentSelect,
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment) {
    throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
  }
  if (comment.authorId !== userId) {
    throw new AppError(403, 'You do not own this comment', 'FORBIDDEN');
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
