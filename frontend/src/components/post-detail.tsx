'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { CommentsSection } from '@/components/comments-section';
import { Notice, Skeleton } from '@/components/feedback';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { deletePost, postPath } from '@/lib/posts-api';
import type { Post } from '@/lib/types';
import { dangerButton, secondaryButton } from '@/lib/ui';
import { useApiData } from '@/lib/use-api-data';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data, error, loading } = useApiData<{ post: Post }>(postPath(id));
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <Notice tone="error">
        {notFound ? 'Post not found.' : 'Could not load this post. Please try again.'}
      </Notice>
    );
  }

  const { post } = data;
  const isOwner = user?.id === post.author.id;

  async function handleDelete() {
    if (!window.confirm('Delete this post and all of its comments?')) {
      return;
    }

    setDeleting(true);
    setDeleteFailed(false);

    try {
      await deletePost(post.id);
      router.push('/my-posts');
    } catch {
      setDeleteFailed(true);
      setDeleting(false);
    }
  }

  return (
    <>
      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            By {post.author.name} · {formatDate(post.createdAt)}
          </p>
        </header>

        {!post.published && <Notice>This post is a draft. Only you can see it.</Notice>}

        {isOwner && (
          <div className="flex gap-3">
            <Link href={`/posts/${post.id}/edit`} className={secondaryButton}>
              Edit
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={dangerButton}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
        {deleteFailed && <Notice tone="error">Could not delete the post. Please try again.</Notice>}

        <div className="leading-7 break-words whitespace-pre-wrap">{post.content}</div>
      </article>

      {post.published && <CommentsSection postId={post.id} />}
    </>
  );
}
