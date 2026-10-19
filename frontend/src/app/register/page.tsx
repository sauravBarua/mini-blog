import type { Metadata } from 'next';
import { RegisterForm } from '@/components/register-form';

export const metadata: Metadata = { title: 'Sign up' };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Create your account</h1>
      <RegisterForm />
    </main>
  );
}
