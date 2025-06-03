'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar que sea admin
    const token = getTokenFromCookie();
    if (!token) {
      router.push('/login');
      return;
    }
    const payload = decodePayload(token);
    if (!payload || payload.type !== true) {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = getTokenFromCookie();
    if (!token) {
      router.push('/login');
      return;
    }

    // Validar campos mínimos en cliente (opcional)
    if (!form.name || !form.price || !form.stock) {
      setError('Nombre, precio y stock son obligatorios');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseInt(form.stock, 10)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Error al crear producto');
        return;
      }
      // Volver al listado
      router.push('/admin/products');
    } catch {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="container my-4 d-flex justify-content-center">
      <div className="col-md-6 col-lg-4">
        <h1 className="mb-4 text-center">Nuevo Producto</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">Descripción</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="price" className="form-label">Precio</label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              className="form-control"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="stock" className="form-label">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              className="form-control"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div className="d-flex justify-content-between">
            <button type="submit" className="btn btn-primary">Crear producto</button>
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="btn btn-secondary ms-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
