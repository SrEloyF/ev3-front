'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // 1) Leemos la cookie 'token'
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1] || '';

    if (!token) {
      // Si no hay token, forzamos redirección a /login
      router.push('/login');
      return;
    }

    // 2) Decodificamos el payload sin verificar la firma
    let payload: { id: number; username: string; type: boolean } | null = null;
    try {
      const base64Payload = token.split('.')[1];
      payload = JSON.parse(atob(base64Payload));
    } catch {
      payload = null;
    }

    if (!payload) {
      // Token inválido → redirigimos a /login
      router.push('/login');
      return;
    }

    if (!payload.type) {
      // Si no es admin (type === false), redirigimos a /dashboard
      router.push('/dashboard');
      return;
    }

    // Si es admin, guardamos datos para mostrar por pantalla
    setUsername(payload.username);
    setIsAdmin(true);
  }, [router]);

  // Mientras validamos, podemos retornar null para no mostrar nada
  if (isAdmin === null) {
    return null;
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Panel de Administración</h1>
      {username && (
        <p>
          Hola, <strong>{username}</strong> (Admin)
        </p>
      )}
      <p>Aquí podrás gestionar el sitio como administrador.</p>
    </div>
  );
}
