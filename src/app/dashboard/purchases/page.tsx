'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

type Purchase = {
  id: number;
  quantity: number;
  total_price: string;
  createdAt: string;
  product: {
    name: string;
  };
};

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    let token = getTokenFromCookie();
    if (!token) {
      token = localStorage.getItem('token') || '';
    }
    if (!token) {
      return;
    }
    const payload = decodePayload(token);
    if (!payload) {
      return;
    }
    const userId = payload.id;

    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/purchases/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPurchases(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  if (loading) {
    return <p className="text-center mt-4">Cargando tu historial...</p>;
  }

  return (
    <div className="container mt-4">
      <h2>🧾 Mi Historial de Compras</h2>

      {purchases.length === 0 ? (
        <p>No has realizado compras aún.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id}>
                <td>{p.product.name}</td>
                <td>{p.quantity}</td>
                <td>${p.total_price}</td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
