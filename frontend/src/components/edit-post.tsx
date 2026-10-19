'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Notice, Skeleton } from '@/components/feedback';
import { PostForm } from '@/components/post-form';
import { postPath } from '@/lib/posts-api';
import type { Post } from '@/lib/types';
import { useApiData } from '@/lib/use-api-data';

export function EditPost() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, error, loading } = useApiData<{ post: Post }>(postPath(id));

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <Notice tone="error">Post not found.</Notice>;
  }

  if (data.post.author.id !== user?.id) {
    return <Notice tone="error">You can only edit your own posts.</Notice>;
  }

  return <PostForm key={data.post.id} post={data.post} />;
}
