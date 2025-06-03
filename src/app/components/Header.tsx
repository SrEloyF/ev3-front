'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

export default function Header() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isNormalUser, setIsNormalUser] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = getTokenFromCookie();
    if (!token) {
      setIsNormalUser(false);
      return;
    }
    const payload = decodePayload(token);
    if (payload && payload.type === false) {
      setIsNormalUser(true);
    } else {
      setIsNormalUser(false);
    }
  }, []);

  if (!isClient) return null;

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #ddd',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Ecommerce</h1>
        {isNormalUser && (
          <>
            <Link href="/cart" legacyBehavior>
              <a style={{ textDecoration: 'none', color: '#0070f3' }}>
                Carrito
              </a>
            </Link>
            <Link href="/cart/history" legacyBehavior>
              <a style={{ textDecoration: 'none', color: '#0070f3' }}>
                Historial
              </a>
            </Link>
          </>
        )}
      </div>
      <LogoutButton />
    </header>
  );
}
