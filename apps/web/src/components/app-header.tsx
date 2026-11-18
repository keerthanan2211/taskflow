'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-store';
import { closeSocket } from '@/lib/socket';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const signOut = () => {
    closeSocket();
    logout();
    qc.clear();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/projects" className="flex items-center gap-2 font-semibold">
          <Logo />
          TaskFlow
        </Link>
        <div className="min-w-0 flex-1">{children}</div>
        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} size="md" />
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function Logo() {
  // Four bars of increasing height: the four board columns
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <rect x="1" y="11" width="4" height="10" rx="1" className="fill-status-todo" />
      <rect x="6.5" y="7" width="4" height="14" rx="1" className="fill-status-progress" />
      <rect x="12" y="4" width="4" height="17" rx="1" className="fill-status-review" />
      <rect x="17.5" y="1" width="4" height="20" rx="1" className="fill-status-done" />
    </svg>
  );
}
