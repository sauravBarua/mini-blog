'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { primaryButton } from '@/lib/ui';

export function SiteHeader() {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  async function handleLogout() {
    await logout().catch(() => undefined);
    router.push('/');
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex min-h-16 max-w-4xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Mini Blog
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {status === 'loading' && (
            <span
              aria-hidden
              className="h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            />
          )}
          {status === 'anonymous' && (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link href="/register" className={primaryButton}>
                Sign up
              </Link>
            </>
          )}
          {status === 'authenticated' && (
            <>
              <Link href="/my-posts" className="hover:underline">
                My posts
              </Link>
              <Link href="/posts/new" className={primaryButton}>
                New post
              </Link>
              <span className="font-medium">{user.name}</span>
              <button type="button" onClick={handleLogout} className="hover:underline">
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
