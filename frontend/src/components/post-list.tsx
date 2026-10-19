'use client';

import { useState } from 'react';
import { Notice, Skeleton } from '@/components/feedback';
import { Pager } from '@/components/pager';
import { PostCard } from '@/components/post-card';
import { myPostsPath, postsPath } from '@/lib/posts-api';
import type { Page, PostSummary } from '@/lib/types';
import { useApiData } from '@/lib/use-api-data';

export function PostList({ scope }: { scope: 'public' | 'mine' }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApiData<Page<PostSummary>>(
    scope === 'mine' ? myPostsPath(page) : postsPath(page),
  );

  if (loading) {
    return (
      <div className="space-y-8 py-6" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <Notice tone="error">Could not load posts. Please try again.</Notice>;
  }

  if (data.data.length === 0) {
    return (
      <Notice>{scope === 'mine' ? 'You have not written any posts yet.' : 'No posts yet.'}</Notice>
    );
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {data.data.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ul>
      <Pager page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
    </>
  );
}
