import type { Metadata } from 'next';
import { EditPost } from '@/components/edit-post';
import { RequireAuth } from '@/components/require-auth';

export const metadata: Metadata = { title: 'Edit post' };

export default function EditPostPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Edit post</h1>
      <RequireAuth>
        <EditPost />
      </RequireAuth>
    </main>
  );
}
