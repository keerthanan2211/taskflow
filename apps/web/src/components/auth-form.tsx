'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, json } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { AuthResponse } from '@/lib/types';
import { Button } from './ui/button';
import { Field, Input } from './ui/field';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters)'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type Values = z.infer<typeof registerSchema>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema) as never,
    defaultValues: isRegister ? { name: '', email: '', password: '' } : { email: '', password: '' },
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    try {
      const res = await api<AuthResponse>(`/auth/${mode}`, { method: 'POST', body: json(values) });
      setSession(res.accessToken, res.user);
      router.replace('/projects');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not reach the server');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{isRegister ? 'Create your account' : 'Sign in to TaskFlow'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isRegister ? 'Start a board and invite your team.' : 'Pick up where your team left off.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4">
          {isRegister && (
            <Field label="Name" error={errors.name?.message}>
              {(a11y) => <Input {...a11y} autoComplete="name" {...register('name')} />}
            </Field>
          )}
          <Field label="Email" error={errors.email?.message}>
            {(a11y) => <Input {...a11y} type="email" autoComplete="email" {...register('email')} />}
          </Field>
          <Field label="Password" error={errors.password?.message} hint={isRegister ? 'At least 8 characters' : undefined}>
            {(a11y) => (
              <Input
                {...a11y}
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                {...register('password')}
              />
            )}
          </Field>

          {serverError && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {isRegister ? 'Already have an account? ' : 'New to TaskFlow? '}
          <Link href={isRegister ? '/login' : '/register'} className="font-medium text-cobalt hover:underline">
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        {!isRegister && (
          <p className="mt-3 text-xs text-muted">Demo login: demo@taskflow.dev / Demo#2026</p>
        )}
      </div>
    </main>
  );
}
