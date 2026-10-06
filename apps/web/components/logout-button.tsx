'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@nizios/ui';

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      className="bg-stone-700"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}
