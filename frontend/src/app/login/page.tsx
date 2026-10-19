import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Log in</h1>
      <LoginForm />
    </main>
  );
}
