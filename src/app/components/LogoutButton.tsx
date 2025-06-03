'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        backgroundColor: '#e00',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        padding: '0.5rem 1rem',
        cursor: 'pointer'
      }}
    >
      Cerrar sesión
    </button>
  );
}
