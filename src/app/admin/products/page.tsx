'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Al montar, verificamos si somos admin
  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      router.push('/login');
      return;
    }
    const payload = decodePayload(token);
    if (!payload || payload.type !== true) {
      // Si no es admin, ir a /dashboard
      router.push('/dashboard');
      return;
    }

    // Si es admin, cargamos productos
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.data);
      } else {
        console.error('Error al listar productos:', data.message);
      }
    } catch (err) {
      console.error('Error de conexión al listar productos' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    const token = getTokenFromCookie();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Refrescar lista
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(data.message || 'Error al eliminar');
      }
    } catch {
      alert('Error de conexión al eliminar');
    }
  };

  if (loading) {
    return <p className="text-center">Cargando productos...</p>;
  }

  return (
    <div className="container my-4">
      <h1 className="mb-4">Panel de Productos (Admin)</h1>
      <button
        onClick={() => router.push('/admin/products/new')}
        className="btn btn-primary mb-3"
      >
        + Añadir producto
      </button>

      {products.length === 0 ? (
        <p>No hay productos registrados.</p>
      ) : (
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>{prod.name}</td>
                <td>${prod.price}</td>
                <td>{prod.stock}</td>
                <td>
                  <button
                    onClick={() => router.push(`/admin/products/${prod.id}/edit`)}
                    className="btn btn-warning btn-sm me-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
