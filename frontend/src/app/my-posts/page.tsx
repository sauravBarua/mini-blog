import type { Metadata } from 'next';
import { PostList } from '@/components/post-list';
import { RequireAuth } from '@/components/require-auth';

export const metadata: Metadata = { title: 'My posts' };

export default function MyPostsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">My posts</h1>
      <RequireAuth>
        <PostList scope="mine" />
      </RequireAuth>
    </main>
  );
}
