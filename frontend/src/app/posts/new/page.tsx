import type { Metadata } from 'next';
import { PostForm } from '@/components/post-form';
import { RequireAuth } from '@/components/require-auth';

export const metadata: Metadata = { title: 'New post' };

export default function NewPostPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New post</h1>
      <RequireAuth>
        <PostForm />
      </RequireAuth>
    </main>
  );
}
