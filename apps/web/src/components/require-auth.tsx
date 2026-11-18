'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { PageMessage } from './ui/spinner';

/** Client-side route guard: waits for the stored session to load, then redirects guests to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  if (!hydrated || !token) return <PageMessage>Loading your workspace…</PageMessage>;
  return <>{children}</>;
}
