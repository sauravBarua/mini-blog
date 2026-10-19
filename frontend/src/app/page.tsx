import { PostList } from '@/components/post-list';

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Latest posts</h1>
      <PostList scope="public" />
    </main>
  );
}
