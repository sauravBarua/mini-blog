import type { Metadata } from 'next';
import { PostDetail } from '@/components/post-detail';

export const metadata: Metadata = { title: 'Post' };

export default function PostPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <PostDetail />
    </main>
  );
}
