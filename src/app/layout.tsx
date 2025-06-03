'use client';

import './styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import LogoutButton from './components/LogoutButton';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

function getTokenFromCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='));
  return cookie ? cookie.split('=')[1] : null;
}

function decodePayload(token: string) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Leemos el token de la cookie
    const token = getTokenFromCookie();
    if (!token) {
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }
    // 2. Decodificamos el payload para ver type
    const payload = decodePayload(token);
    if (payload && typeof payload.type === 'boolean') {
      setIsAuthenticated(true);
      setIsAdmin(payload.type === true);
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  }, []);

  // No mostrar header en /login ni /register
  const hideHeader = pathname === '/login' || pathname === '/register';

  return (
    <html lang="es">
      <head />
      <body>
        {!hideHeader && (
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
            <h1 style={{ margin: 0 }}>Ecommerce</h1>

            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {!isAdmin && (
                  <>
                    <Link href="/cart" legacyBehavior>
                      <a style={{ textDecoration: 'none', color: '#0070f3' }}>Carrito</a>
                    </Link>
                    <Link href="/cart/history" legacyBehavior>
                      <a style={{ textDecoration: 'none', color: '#0070f3' }}>Historial</a>
                    </Link>
                  </>
                )}
                <LogoutButton />
              </div>
            )}
          </header>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
