import { BackendStatus } from '@/components/backend-status';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Mini Blog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Next.js frontend talking to the Express API through a same-origin proxy.
        </p>
      </header>
      <BackendStatus />
    </main>
  );
}
