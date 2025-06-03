'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

type CartWithItems = {
  id: number;
  userId: number;
  status: string;
  updatedAt: string;
  items: Array<{
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: string;
    };
  }>;
};

export default function CartHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<CartWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedCarts, setExpandedCarts] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      router.push('/login');
      return;
    }
    const payload = decodePayload(token);
    if (!payload) {
      router.push('/login');
      return;
    }
    fetchHistory();
  }, [router]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al cargar historial');
        return;
      }
      setHistory(data.data);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Error de conexión al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  const toggleCartExpansion = (cartId: number) => {
    setExpandedCarts(prev => ({
      ...prev,
      [cartId]: !prev[cartId]
    }));
  };

  const calculateTotal = (items: CartWithItems['items']) => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'completado':
        return 'bg-success';
      case 'pending':
      case 'pendiente':
        return 'bg-warning';
      case 'cancelled':
      case 'cancelado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'completado':
        return 'Completado';
      case 'pending':
      case 'pendiente':
        return 'Pendiente';
      case 'cancelled':
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5 className="text-muted">Cargando historial de compras...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h1 className="display-5 fw-bold text-primary mb-2">
                  <i className="bi bi-clock-history me-2"></i>
                  Historial de Compras
                </h1>
                <p className="text-muted mb-0">
                  {history.length > 0 
                    ? `${history.length} compra${history.length !== 1 ? 's' : ''} realizada${history.length !== 1 ? 's' : ''}`
                    : 'No tienes compras registradas'
                  }
                </p>
              </div>
              <div className="d-flex gap-2">
                <button
                  onClick={() => router.push('/cart')}
                  className="btn btn-outline-primary"
                >
                  <i className="bi bi-cart3 me-2"></i>
                  Mi Carrito
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-primary"
                >
                  <i className="bi bi-shop me-2"></i>
                  Catálogo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {errorMsg}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setErrorMsg(null)}
                ></button>
              </div>
            </div>
          </div>
        )}

        {history.length === 0 ? (
          /* Empty History */
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-bag-x display-1 text-muted mb-4"></i>
                  <h3 className="text-muted mb-3">No tienes compras previas</h3>
                  <p className="text-muted mb-4">
                    ¡Realiza tu primera compra y aparecerá aquí tu historial!
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="btn btn-primary btn-lg"
                    >
                      <i className="bi bi-shop me-2"></i>
                      Explorar productos
                    </button>
                    <button
                      onClick={() => router.push('/cart')}
                      className="btn btn-outline-primary btn-lg"
                    >
                      <i className="bi bi-cart3 me-2"></i>
                      Ver carrito actual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Purchase History */
          <div className="row">
            <div className="col-12">
              {history.map((cart, index) => {
                const total = calculateTotal(cart.items);
                const { date, time } = formatDate(cart.updatedAt);
                const isExpanded = expandedCarts[cart.id];

                return (
                  <div key={cart.id} className="card shadow-sm mb-4 hover-shadow transition-all">
                    {/* Card Header */}
                    <div className="card-header bg-white">
                      <div className="row align-items-center">
                        <div className="col-12 col-md-6">
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <i className="bi bi-receipt-cutoff fs-4 text-primary"></i>
                            </div>
                            <div>
                              <h5 className="mb-1 fw-bold">
                                Orden #{cart.id.toString().padStart(6, '0')}
                              </h5>
                              <div className="d-flex align-items-center gap-2">
                                <span className={`badge ${getStatusBadge(cart.status)}`}>
                                  {getStatusText(cart.status)}
                                </span>
                                <small className="text-muted">
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {date}
                                </small>
                                <small className="text-muted">
                                  <i className="bi bi-clock me-1"></i>
                                  {time}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-12 col-md-6 mt-2 mt-md-0">
                          <div className="d-flex align-items-center justify-content-md-end">
                            <div className="me-3 text-end">
                              <div className="fw-bold text-primary fs-5">
                                ${total.toLocaleString()}
                              </div>
                              <small className="text-muted">
                                {cart.items.length} artículo{cart.items.length !== 1 ? 's' : ''}
                              </small>
                            </div>
                            <button
                              onClick={() => toggleCartExpansion(cart.id)}
                              className="btn btn-outline-primary btn-sm"
                            >
                              <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                              {isExpanded ? 'Ocultar' : 'Ver detalles'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="border-0">
                                  <i className="bi bi-box me-2"></i>
                                  Producto
                                </th>
                                <th className="border-0 text-center">
                                  <i className="bi bi-currency-dollar me-2"></i>
                                  Precio Unit.
                                </th>
                                <th className="border-0 text-center">
                                  <i className="bi bi-123 me-2"></i>
                                  Cantidad
                                </th>
                                <th className="border-0 text-end">
                                  <i className="bi bi-calculator me-2"></i>
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {cart.items.map((item, itemIndex) => {
                                const subtotal = parseFloat(item.product.price) * item.quantity;
                                return (
                                  <tr key={item.id} className={itemIndex % 2 === 0 ? 'bg-light bg-opacity-50' : ''}>
                                    <td className="align-middle">
                                      <div className="fw-semibold">{item.product.name}</div>
                                    </td>
                                    <td className="align-middle text-center">
                                      <span className="badge bg-light text-dark">
                                        ${parseFloat(item.product.price).toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="align-middle text-center">
                                      <span className="badge bg-primary">
                                        {item.quantity}
                                      </span>
                                    </td>
                                    <td className="align-middle text-end">
                                      <strong className="text-success">
                                        ${subtotal.toLocaleString()}
                                      </strong>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="table-active">
                                <td colSpan={3} className="text-end fw-bold">
                                  <i className="bi bi-cash-stack me-2"></i>
                                  Total de la orden:
                                </td>
                                <td className="text-end">
                                  <strong className="text-primary fs-5">
                                    ${total.toLocaleString()}
                                  </strong>
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Additional Info */}
                        <div className="row mt-3 pt-3 border-top">
                          <div className="col-12 col-md-6">
                            <div className="d-flex align-items-center text-muted">
                              <i className="bi bi-info-circle me-2"></i>
                              <small>
                                ID de transacción: <code>N-{cart.id}-{new Date(cart.updatedAt).getFullYear()}</code>
                              </small>
                            </div>
                          </div>
                          <div className="col-12 col-md-6 mt-2 mt-md-0">
                            <div className="d-flex align-items-center justify-content-md-end">
                              <div className="d-flex align-items-center text-success">
                                <i className="bi bi-shield-check me-2"></i>
                                <small>Compra verificada y procesada</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary Stats */}
              <div className="card shadow-sm bg-primary text-white">
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-12 col-md-4 mb-3 mb-md-0">
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-bag-check-fill fs-2 mb-2"></i>
                        <div className="fw-bold fs-4">{history.length}</div>
                        <div className="small opacity-75">Compras realizadas</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4 mb-3 mb-md-0">
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-box-seam-fill fs-2 mb-2"></i>
                        <div className="fw-bold fs-4">
                          {history.reduce((total, cart) => total + cart.items.length, 0)}
                        </div>
                        <div className="small opacity-75">Productos comprados</div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="d-flex flex-column align-items-center">
                        <i className="bi bi-currency-dollar fs-2 mb-2"></i>
                        <div className="fw-bold fs-4">
                          ${history.reduce((total, cart) => total + calculateTotal(cart.items), 0).toLocaleString()}
                        </div>
                        <div className="small opacity-75">Total gastado</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .hover-shadow {
          transition: all 0.3s ease;
        }
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
}