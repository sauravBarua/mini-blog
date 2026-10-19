import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { PostSummary } from '@/lib/types';

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <li className="py-6">
      <article className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          <Link href={`/posts/${post.id}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            {post.author.name} · {formatDate(post.createdAt)}
          </span>
          {!post.published && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Draft
            </span>
          )}
        </p>
      </article>
    </li>
  );
}
