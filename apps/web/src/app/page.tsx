'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { PageMessage } from '@/components/ui/spinner';

export default function Home() {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated) router.replace(token ? '/projects' : '/login');
  }, [hydrated, token, router]);

  return <PageMessage>Opening TaskFlow…</PageMessage>;
}
