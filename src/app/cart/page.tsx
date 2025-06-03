'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTokenFromCookie, decodePayload } from '@/app/lib/jwt';

type CartItem = {
  id: number;
  cartId: number;
  userId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    stock: number;
    image_url: string;
  };
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<{ [key: number]: boolean }>({});
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

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
    fetchCart();
  }, [router]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al cargar carrito');
        return;
      }
      setItems(data.data.cart.items);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Error de conexión al cargar carrito');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    if (/^\d*$/.test(value)) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, quantity: parseInt(value || '0', 10) } : it
        )
      );
    }
  };

  const handleUpdateItem = async (item: CartItem) => {
    setErrorMsg(null);
    setIsUpdating({ ...isUpdating, [item.id]: true });
    
    if (item.quantity < 1) {
      setErrorMsg('La cantidad debe ser al menos 1');
      setIsUpdating({ ...isUpdating, [item.id]: false });
      return;
    }
    if (item.quantity > item.product.stock) {
      setErrorMsg(`Stock insuficiente para ${item.product.name}`);
      setIsUpdating({ ...isUpdating, [item.id]: false });
      return;
    }
    try {
      const token = getTokenFromCookie();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cart/items/${item.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: item.quantity })
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al actualizar ítem');
        return;
      }
      fetchCart();
    } catch {
      setErrorMsg('Error de conexión al actualizar ítem');
    } finally {
      setIsUpdating({ ...isUpdating, [item.id]: false });
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    try {
      const token = getTokenFromCookie();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cart/items/${item.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al eliminar ítem');
        return;
      }
      fetchCart();
    } catch {
      setErrorMsg('Error de conexión al eliminar ítem');
    }
  };

  const handleCheckout = async () => {
    setErrorMsg(null);
    setIsProcessingCheckout(true);
    try {
      const token = getTokenFromCookie();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Error al procesar checkout');
        return;
      }
      // Show success message
      setErrorMsg('¡Tu compra ha sido procesada correctamente!');
      setTimeout(() => {
        fetchCart();
      }, 2000);
    } catch {
      setErrorMsg('Error de conexión al procesar checkout');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.product.price) * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <h5 className="text-muted">Cargando carrito...</h5>
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
                  <i className="bi bi-cart3 me-2"></i>
                  Mi Carrito
                </h1>
                <p className="text-muted mb-0">
                  {items.length > 0 
                    ? `${items.length} artículo${items.length !== 1 ? 's' : ''} en tu carrito`
                    : 'Tu carrito está vacío'
                  }
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-outline-primary"
              >
                <i className="bi bi-arrow-left me-2"></i>
                Seguir comprando
              </button>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {errorMsg && (
          <div className="row mb-4">
            <div className="col-12">
              <div className={`alert ${
                errorMsg.includes('correctamente') || errorMsg.includes('procesada') 
                  ? 'alert-success' 
                  : 'alert-danger'
              } alert-dismissible fade show`} role="alert">
                <i className={`bi ${
                  errorMsg.includes('correctamente') || errorMsg.includes('procesada')
                    ? 'bi-check-circle'
                    : 'bi-exclamation-triangle'
                } me-2`}></i>
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

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="bi bi-cart-x display-1 text-muted mb-4"></i>
                  <h3 className="text-muted mb-3">Tu carrito está vacío</h3>
                  <p className="text-muted mb-4">
                    ¡Explora nuestros productos y encuentra algo que te guste!
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn btn-primary btn-lg"
                  >
                    <i className="bi bi-shop me-2"></i>
                    Ir al catálogo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cart Items */
          <div className="row">
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-list-ul me-2"></i>
                    Productos en tu carrito
                  </h5>
                </div>
                <div className="card-body p-0">
                  {items.map((item, index) => {
                    const subtotal = (parseFloat(item.product.price) * item.quantity);
                    return (
                      <div key={item.id} className={`p-4 ${index !== items.length - 1 ? 'border-bottom' : ''}`}>
                        <div className="row align-items-center">
                          {/* Product Image */}
                          <div className="col-12 col-md-2 mb-3 mb-md-0">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="img-fluid rounded"
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Product Info */}
                          <div className="col-12 col-md-4 mb-3 mb-md-0">
                            <h6 className="fw-bold mb-1">{item.product.name}</h6>
                            <p className="text-muted small mb-1">
                              <i className="bi bi-tag me-1"></i>
                              ${parseFloat(item.product.price).toLocaleString()} c/u
                            </p>
                            <p className="text-muted small mb-0">
                              <i className="bi bi-box-seam me-1"></i>
                              Stock disponible: {item.product.stock}
                            </p>
                          </div>

                          {/* Quantity */}
                          <div className="col-12 col-md-2 mb-3 mb-md-0">
                            <label className="form-label small text-muted">Cantidad</label>
                            <div className="input-group input-group-sm">
                              <input
                                type="number"
                                className="form-control text-center"
                                min="1"
                                max={item.product.stock}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="col-12 col-md-2 mb-3 mb-md-0 text-center">
                            <label className="form-label small text-muted">Subtotal</label>
                            <p className="fw-bold text-primary mb-0">
                              ${subtotal.toLocaleString()}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="col-12 col-md-2 text-center">
                            <div className="btn-group-vertical w-100" role="group">
                              <button
                                onClick={() => handleUpdateItem(item)}
                                disabled={isUpdating[item.id]}
                                className="btn btn-outline-success btn-sm mb-1"
                              >
                                {isUpdating[item.id] ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                    Actualizando...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-arrow-clockwise me-1"></i>
                                    Actualizar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('¿Deseas eliminar este artículo del carrito?')) {
                                    handleRemoveItem(item);
                                  }
                                }}
                                className="btn btn-outline-danger btn-sm"
                              >
                                <i className="bi bi-trash me-1"></i>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm position-sticky" style={{ top: '2rem' }}>
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-receipt me-2"></i>
                    Resumen del pedido
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal ({items.length} artículos)</span>
                    <span>${calculateTotal().toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Envío</span>
                    <span className="text-success">Gratis</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-3">
                    <strong>Total</strong>
                    <strong className="text-primary fs-4">
                      ${calculateTotal().toLocaleString()}
                    </strong>
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessingCheckout || items.length === 0}
                      className="btn btn-primary btn-lg"
                    >
                      {isProcessingCheckout ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-credit-card me-2"></i>
                          Finalizar Compra
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="btn btn-outline-secondary"
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Continuar comprando
                    </button>
                  </div>

                  <div className="mt-3 p-3 bg-light rounded">
                    <div className="d-flex align-items-center text-success">
                      <i className="bi bi-shield-check me-2"></i>
                      <small>Compra 100% segura</small>
                    </div>
                    <div className="d-flex align-items-center text-success mt-1">
                      <i className="bi bi-truck me-2"></i>
                      <small>Envío gratis en todos los pedidos</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .position-sticky {
          position: -webkit-sticky;
          position: sticky;
        }
        .object-fit-cover {
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}