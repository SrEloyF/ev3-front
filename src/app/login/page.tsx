'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Credenciales inválidas');
        return;
      }

      // Extraemos el token del backend
      const token = data.data.token as string;

      // Guardamos la cookie 'token' (para que el middleware la lea)
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 2}`;

      let payload: { id: number; username: string; type: boolean } | null = null;
      try {
        const base64Payload = token.split('.')[1];
        payload = JSON.parse(atob(base64Payload));
      } catch {
        payload = null;
      }

      if (payload && payload.type) {
        router.push('/admin/products');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body">
          <h1 className="card-title text-center mb-4">Iniciar sesión</h1>
          
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Correo:</label>
              <input
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Contraseña:</label>
              <input
                type="password"
                name="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">Entrar</button>
          </form>
          
          <p className="mt-3 text-center">
            ¿No tienes cuenta? <a href="/register" className="link-primary">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  );
}
