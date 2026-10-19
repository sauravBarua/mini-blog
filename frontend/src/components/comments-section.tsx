'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Notice, Skeleton } from '@/components/feedback';
import { TextAreaField } from '@/components/form-field';
import { Pager } from '@/components/pager';
import { formatDate } from '@/lib/format';
import { noErrors, toFormErrors, type FormErrors } from '@/lib/form-errors';
import { COMMENTS_PAGE_SIZE, commentsPath, createComment, deleteComment } from '@/lib/posts-api';
import type { Comment, Page } from '@/lib/types';
import { primaryButton } from '@/lib/ui';
import { useApiData } from '@/lib/use-api-data';

export function CommentsSection({ postId }: { postId: string }) {
  const { status, user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApiData<Page<Comment>>(commentsPath(postId, page));
  const [errors, setErrors] = useState<FormErrors>(noErrors);
  const [submitting, setSubmitting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get('content'));

    setErrors(noErrors);
    setSubmitting(true);

    try {
      await createComment(postId, content);
      form.reset();

      // New comments are listed last, so jump to the last page.
      const lastPage = Math.max(1, Math.ceil(((data?.meta.total ?? 0) + 1) / COMMENTS_PAGE_SIZE));
      if (lastPage === page) {
        reload();
      } else {
        setPage(lastPage);
      }
    } catch (caught) {
      setErrors(toFormErrors(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeleteFailed(false);

    try {
      await deleteComment(commentId);
      if (page > 1 && data?.data.length === 1) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch {
      setDeleteFailed(true);
    }
  }

  return (
    <section className="mt-12 space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-xl font-semibold tracking-tight">
        Comments{data ? ` (${data.meta.total})` : ''}
      </h2>

      {status === 'authenticated' && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {errors.form && <Notice tone="error">{errors.form}</Notice>}
          <TextAreaField
            id="comment"
            name="content"
            label="Add a comment"
            required
            rows={3}
            maxLength={2000}
            error={errors.fields.content}
          />
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      )}
      {status === 'anonymous' && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="font-medium underline">
            Log in
          </Link>{' '}
          to leave a comment.
        </p>
      )}

      {deleteFailed && (
        <Notice tone="error">Could not delete the comment. Please try again.</Notice>
      )}

      {loading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}
      {!loading && (error || !data) && (
        <Notice tone="error">Could not load comments. Please try again.</Notice>
      )}
      {data && data.data.length === 0 && <Notice>No comments yet.</Notice>}
      {data && data.data.length > 0 && (
        <>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.data.map((comment) => (
              <li key={comment.id} className="space-y-1 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">{comment.author.name}</span> ·{' '}
                    {formatDate(comment.createdAt)}
                  </p>
                  {user?.id === comment.author.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-sm text-red-700 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="break-words whitespace-pre-wrap">{comment.content}</p>
              </li>
            ))}
          </ul>
          <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}
