'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { FormField } from '@/components/form-field';
import { noErrors, toFormErrors, type FormErrors } from '@/lib/form-errors';
import { primaryButton } from '@/lib/ui';

export function LoginForm() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [errors, setErrors] = useState<FormErrors>(noErrors);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setErrors(noErrors);
    setSubmitting(true);

    try {
      await login({
        email: String(data.get('email')),
        password: String(data.get('password')),
      });
      // The effect above redirects once the session is set.
    } catch (error) {
      setErrors(toFormErrors(error));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && (
        <p
          role="alert"
          className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {errors.form}
        </p>
      )}
      <FormField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={errors.fields.email}
      />
      <FormField
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={errors.fields.password}
      />
      <button type="submit" disabled={submitting} className={`${primaryButton} w-full`}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account yet?{' '}
        <Link href="/register" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
